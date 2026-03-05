import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()

        const { id } = await params

        const session = await auth()

        const deliveryBoyId = session?.user?.id

        if (!deliveryBoyId) {
            return NextResponse.json({ success: false, message: "Delivery boy not found" }, { status: 404 });
        }

        const assignment = await DeliveryAssignment.findById(id)

        if (!assignment) {
            return NextResponse.json({ success: false, message: "Assignment not found" }, { status: 404 })
        }

        if (assignment?.status !== 'brodcasted') {
            return NextResponse.json({ success: false, message: "Assignment is no longer available" }, { status: 400 })
        }

        await DeliveryAssignment.findByIdAndUpdate(id, {
            $pull: { brodcastedTo: deliveryBoyId }
        })

        const updatedAssignment = await DeliveryAssignment.findById(id)

        if (!updatedAssignment) {
            return NextResponse.json({ success: false, message: "Assignment not found after update" }, { status: 404 })
        }

        if (updatedAssignment.brodcastedTo.length === 0) {
            updatedAssignment.status = 'rejected'
            await updatedAssignment.save()

            const order = await Orders.findById(updatedAssignment.order)
            if (order) {
                order.status = 'Pending'
                order.assignment = null
                order.assignedDeliveryBoy = null
                await order.save()
            }

            await emitEventHandler('all-rejected', {
                assignmentId: updatedAssignment._id,
                orderId: updatedAssignment.order,
            })
        }

        await emitEventHandler('assignment-rejected', {
            assignmentId: updatedAssignment._id,
            orderId: updatedAssignment.order,
            deliveryBoyId,
        })

        return NextResponse.json({ success: true, assignment: updatedAssignment, message: "Assignment rejected successfully" }, { status: 200 })
    } catch (error) {
        console.error('Error rejecting assignment:', error)
        return NextResponse.json({ success: false, message: "Failed to reject assignment" }, { status: 500 })
    }
}