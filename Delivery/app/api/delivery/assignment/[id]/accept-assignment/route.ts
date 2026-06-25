import { auth } from "@/app/auth"
import connectDB from "@/app/lib/db"
import DeliveryAssignment from "@/app/models/deliveryAssignment.model"
import Orders from "@/app/models/orders.model"
import { NextRequest, NextResponse } from "next/server"
import { emitEventHandler } from "@/app/lib/emitEventHandler"


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()

        const { id } = await params

        const session = await auth()

        const deliveryBoyId = session?.user?.id

        if ((session?.user as any)?.role !== 'deliveryBoy') {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({ assignedTo: deliveryBoyId, status: { $nin: ['brodcasted', 'completed', 'rejected'] } })

        if (alreadyAssigned) {
            return NextResponse.json({ success: false, message: "You are already assigned to another assignment" }, { status: 400 })
        }

        // Atomic update: only succeeds if status is still 'brodcasted'
        const assignment = await DeliveryAssignment.findOneAndUpdate(
            { _id: id, status: { $in: ['brodcasted', 'pending'] } },
            { assignedTo: deliveryBoyId, status: 'assigned', accpectedAt: new Date() },
            { new: true }
        )

        if (!assignment) {
            return NextResponse.json({ success: false, message: "Assignment is no longer available !" }, { status: 400 })
        }

        const order = await Orders.findById(assignment?.order)

        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
        }

        order.assignedDeliveryBoy = deliveryBoyId
        order.status = 'Out of delivery'
        await order.save()

        await order.populate('user assignedDeliveryBoy');
        // Gọi event socket khi accpect order
        await emitEventHandler('order-assigned', { orderId: order?._id, assignmentDeliveryBoy: order?.assignedDeliveryBoy, status: order?.status })

        // Thông báo tất cả delivery boys khác rằng đơn hàng đã được nhận → xóa khỏi danh sách
        await emitEventHandler('assignment-accepted', { assignmentId: assignment?._id, orderId: order?._id })

        // await DeliveryAssignment.updateMany({
        //     _id: { $ne: assignment?._id },
        //     brodcastedTo: deliveryBoyId,
        //     status: 'brodcasted'
        // }, {
        //     $pull: {
        //         brodcastedTo: deliveryBoyId
        //     }
        // })

        return NextResponse.json({ success: true, assignment, message: "Order accepted successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "API Accept Assignment Failed" }, { status: 500 })
    }
}