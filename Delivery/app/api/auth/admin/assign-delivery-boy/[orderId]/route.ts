import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import { sendEmail } from "@/app/lib/mailer";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { orderId } = await params;
        const { deliveryBoyId } = await req.json();

        if (!deliveryBoyId) {
            return NextResponse.json({ success: false, message: 'deliveryBoyId is required' }, { status: 400 });
        }

        const [order, deliveryBoy] = await Promise.all([
            Orders.findById(orderId).populate('user'),
            User.findById(deliveryBoyId).select('name mobile socketId isOnline'),
        ]);

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        if (!deliveryBoy) {
            return NextResponse.json({ success: false, message: 'Delivery boy not found' }, { status: 404 });
        }

        if (order.status !== 'Pending') {
            return NextResponse.json({
                success: false,
                message: `Cannot assign — order is already "${order.status}"`
            }, { status: 400 });
        }

        // Xóa assignment cũ nếu có
        if (order.assignment) {
            await DeliveryAssignment.deleteMany({ order: orderId });
        }

        // Tạo assignment trực tiếp (không cần broadcast)
        const assignment = await DeliveryAssignment.create({
            order: orderId,
            brodcastedTo: [deliveryBoyId],
            assignedTo: deliveryBoyId,
            status: 'assigned',
            accpectedAt: new Date(),
        });

        await assignment.populate('order');

        // Cập nhật Order
        order.assignment = assignment._id;
        order.assignedDeliveryBoy = deliveryBoyId;
        order.status = 'Out of delivery';
        await order.save();
        await order.populate('user assignedDeliveryBoy');

        // Socket: notify delivery boy được chỉ định
        if (deliveryBoy.socketId) {
            await emitEventHandler(
                'new-assignment',
                { assignment: assignment._id, order: assignment.order },
                deliveryBoy.socketId
            );
        }

        // Socket: broadcast cập nhật trạng thái order
        await emitEventHandler('order-status-updated', {
            orderId: order._id,
            status: order.status,
            assignedDeliveryBoy: order.assignedDeliveryBoy,
        });

        // Gửi email thông báo user
        try {
            const userDoc = order.user as any;
            if (userDoc?.email) {
                await sendEmail(
                    userDoc.email,
                    `Your order is out for delivery! — #${String(order._id).slice(-6)}`,
                    `<h2>Your order is out for delivery! 🚚</h2>
                     <p>Order ID: <strong>#${String(order._id).slice(-6)}</strong></p>
                     <p>Delivery boy: <strong>${deliveryBoy.name}</strong></p>
                     <p>Thank you for using our service!</p>`
                );
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: `Order assigned to ${deliveryBoy.name} successfully`,
            assignedDeliveryBoy: {
                _id: deliveryBoy._id,
                name: deliveryBoy.name,
                mobile: deliveryBoy.mobile,
            },
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to assign delivery boy' }, { status: 500 });
    }
}
