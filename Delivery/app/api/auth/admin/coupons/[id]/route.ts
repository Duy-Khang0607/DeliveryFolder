import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Coupon from "@/app/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";

const checkAdmin = async () => {
    const session = await auth();
    return session?.user && (session.user as any)?.role === 'admin' ? session : null;
};

// PUT — cập nhật coupon
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const session = await checkAdmin();
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        if (body.code) body.code = body.code.toUpperCase().trim();
        if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

        const coupon = await Coupon.findByIdAndUpdate(id, body, { new: true });
        if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Coupon updated', coupon }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to update coupon' }, { status: 500 });
    }
}

// DELETE — xóa coupon
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();
        const session = await checkAdmin();
        if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });

        return NextResponse.json({ success: true, message: 'Coupon deleted' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to delete coupon' }, { status: 500 });
    }
}
