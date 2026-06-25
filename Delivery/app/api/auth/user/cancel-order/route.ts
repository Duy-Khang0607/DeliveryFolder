import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";



export async function DELETE(req: NextRequest) {
    try {
        // connect DB
        await connectDB();

        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { orderId } = await req.json()

        if (!orderId) {
            return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 })
        }

        const order = await Orders.findById(orderId).populate('user')

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 })
        }

        if (order.user._id.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: 'You are not authorized to cancel this order' }, { status: 403 })
        }

        if (order.status === 'Pending') {
            // Cập nhật status order
            order.status = 'Cancelled'

            // Sau khi set order.status = 'Cancelled'
            await Promise.all(order.items.map((item: any) =>
                Grocery.findByIdAndUpdate(item.grocery, { $inc: { stock: item.quantity } })
            ))

            // Cleanup nếu có assignment
            if (order.assignment) {
                await DeliveryAssignment.deleteMany({ order: order._id })
                order.assignment = null
                order.assignedDeliveryBoy = null
            }

            // Lưu order
            await order.save()

            // Gọi event socket khi cập nhật trạng thái đơn hàng
            await emitEventHandler("order-status-updated", { orderId: order._id, status: 'Cancelled' })

            // Trả về response thành công
            return NextResponse.json({ success: true, message: 'Order cancelled successfully' }, { status: 200 })
        }

        // Trả về response lỗi nếu order không phải là pending
        return NextResponse.json({ success: false, message: 'Order is not pending' }, { status: 400 })

    } catch (error: any) {
        return NextResponse.json({ success: false, message: error?.message || 'Internal server error' }, { status: 500 });
    }
}