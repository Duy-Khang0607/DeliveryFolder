import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const session = await auth()
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const orders = await Orders.find({}).populate('user assignedDeliveryBoy').sort({ createdAt: -1 }).limit(200);

        if (!orders) {
            return NextResponse.json({ success: false, message: 'Not found orders items' }, { status: 400 });
        }
        return NextResponse.json(orders, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed order items' }, { status: 500 });
    }
}