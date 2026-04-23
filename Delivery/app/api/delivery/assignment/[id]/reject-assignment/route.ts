import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
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
            $pull: { brodcastedTo: deliveryBoyId },
            $push: { rejectedBy: deliveryBoyId },
        })

        const updatedAssignment = await DeliveryAssignment.findById(id)

        if (!updatedAssignment) {
            return NextResponse.json({ success: false, message: "Assignment not found after update" }, { status: 404 })
        }

        if (updatedAssignment.brodcastedTo.length === 0) {
            const order = await Orders.findById(updatedAssignment.order)

            if (!order || !order.address?.latitude || !order.address?.longitude) {
                updatedAssignment.status = 'rejected'
                await updatedAssignment.save()

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

                await emitEventHandler("order-status-updated", { orderId: order?._id, status: order?.status, assignedDeliveryBoy: null as any })

            } else {
                const { latitude, longitude } = order.address
                const rejectedIds = updatedAssignment.rejectedBy.map((id: any) => String(id))

                const nearbyDeliveryBoys = await User.find({
                    role: 'deliveryBoy',
                    isOnline: true,
                    _id: { $nin: updatedAssignment.rejectedBy },
                    location: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] },
                            $maxDistance: 10000,
                        }
                    }
                })

                const nearByIds = nearbyDeliveryBoys.map((boy: any) => boy._id)

                const busyIds = await DeliveryAssignment.find({
                    assignedTo: { $in: nearByIds },
                    status: 'assigned',
                }).distinct('assignedTo')

                const busyIdSet = new Set(busyIds.map((id: any) => String(id)))

                const availableDeliveryBoys = nearbyDeliveryBoys.filter(
                    (boy: any) => !busyIdSet.has(String(boy._id))
                )

                const candidates = availableDeliveryBoys.map((b: any) => b._id)

                if (candidates?.length > 0) {
                    updatedAssignment.brodcastedTo = candidates
                    await updatedAssignment.save()

                    await updatedAssignment.populate('order')

                    // Batch fetch in one query (eliminates N+1)
                    const boys = await User.find({ _id: { $in: candidates } }).select('socketId')
                    for (const boy of boys) {
                        if (boy?.socketId) {
                            await emitEventHandler('new-assignment', {
                                assignment: updatedAssignment._id,
                                order: updatedAssignment.order,
                                socketId: boy.socketId,
                            })
                        }
                    }
                } else {
                    updatedAssignment.status = 'rejected'
                    await updatedAssignment.save()

                    order.status = 'Pending'
                    order.assignment = null
                    order.assignedDeliveryBoy = null
                    await order.save()

                    await emitEventHandler('all-rejected', {
                        assignmentId: updatedAssignment._id,
                        orderId: updatedAssignment.order,
                        message: `OrderId ${updatedAssignment?.order?.toString()?.slice(-6)} has been rejected by all delivery boys`
                    })

                    await emitEventHandler("order-status-updated", { orderId: order?._id, status: order?.status, assignedDeliveryBoy: null as any })
                }
            }
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