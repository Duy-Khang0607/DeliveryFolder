import { auth } from "@/app/auth"
import connectDB from "@/app/lib/db"
import Orders from "@/app/models/orders.model"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
    try {
        await connectDB()

        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { orderId } = await params

        const order = await Orders.findById(orderId).populate('assignedDeliveryBoy')

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
        }

        // Ensure users can only access their own orders
        if ((session.user as any)?.role === 'user' && order.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ success: true, order }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to get order' }, { status: 500 })
    }
}