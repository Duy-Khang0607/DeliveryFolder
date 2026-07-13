import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Coupon from "@/app/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";

const checkAdmin = async () => {
    const session = await auth();
    return session?.user && (session.user as any)?.role === 'admin' ? session : null;
};

// GET — danh sách tất cả coupons
export async function GET() {
    try {
        await connectDB();
        const session = await checkAdmin();
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, coupons }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to get coupons' }, { status: 500 });
    }
}

// POST — tạo coupon mới
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const session = await checkAdmin();
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = await req.json();

        if (!code || !discountType || discountValue == null) {
            return NextResponse.json({ success: false, message: 'code, discountType, discountValue are required' }, { status: 400 });
        }

        if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
            return NextResponse.json({ success: false, message: 'Percentage must be between 1 and 100' }, { status: 400 });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Coupon code already exists' }, { status: 400 });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount ?? 0,
            maxUses: maxUses ?? null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            isActive: isActive ?? true,
        });

        return NextResponse.json({ success: true, message: 'Coupon created', coupon }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to create coupon' }, { status: 500 });
    }
}
