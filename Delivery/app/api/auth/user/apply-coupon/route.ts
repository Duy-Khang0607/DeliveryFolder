import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Coupon from "@/app/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { code, orderAmount } = await req.json();

        if (!code || orderAmount == null) {
            return NextResponse.json({ success: false, message: 'Code and orderAmount are required' }, { status: 400 });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon || !coupon.isActive) {
            return NextResponse.json({ success: false, message: 'Coupon not found or inactive' }, { status: 404 });
        }

        // Check expiry
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ success: false, message: 'Coupon has expired' }, { status: 400 });
        }

        // Check max uses
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ success: false, message: 'Coupon usage limit reached' }, { status: 400 });
        }

        // Check already used by this user
        const alreadyUsed = coupon.usedBy.some(
            (id: any) => id.toString() === session.user.id
        );
        if (alreadyUsed) {
            return NextResponse.json({ success: false, message: 'You have already used this coupon' }, { status: 400 });
        }

        // Check minimum order amount
        if (orderAmount < coupon.minOrderAmount) {
            return NextResponse.json({
                success: false,
                message: `Minimum order amount is $${coupon.minOrderAmount}`
            }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (orderAmount * coupon.discountValue) / 100;
        } else {
            discountAmount = Math.min(coupon.discountValue, orderAmount);
        }

        discountAmount = Math.round(discountAmount * 100) / 100;

        return NextResponse.json({
            success: true,
            message: `Coupon applied! You saved $${discountAmount}`,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to apply coupon' }, { status: 500 });
    }
}
