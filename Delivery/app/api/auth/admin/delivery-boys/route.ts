import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextResponse } from "next/server";
import { DELIVERY_EARNING_PER_ORDER } from "@/app/lib/currency";

export async function GET() {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const deliveryBoys = await User.find({ role: 'deliveryBoy' }).lean();

        if (!deliveryBoys.length) {
            return NextResponse.json({ success: true, deliveryBoys: [] }, { status: 200 });
        }

        const ids = deliveryBoys.map(b => b._id);

        // Dùng Orders để đếm completedDeliveries vì DeliveryAssignment.assignedTo bị set null sau OTP verify
        // Orders.assignedDeliveryBoy giữ nguyên sau khi giao hàng
        const [deliveredOrders, assignments] = await Promise.all([
            Orders.find({
                assignedDeliveryBoy: { $in: ids },
                status: 'Delivered',
            }).select('assignedDeliveryBoy deliveredAt totalAmount shipperEarning').lean(),

            DeliveryAssignment.find({
                $or: [
                    { brodcastedTo: { $in: ids } },
                    { rejectedBy: { $in: ids } },
                ]
            }).select('brodcastedTo rejectedBy status accpectedAt').lean(),
        ]);

        const deliveryBoysWithStats = deliveryBoys.map(boy => {
            const boyId = boy._id.toString();

            // completedDeliveries từ Orders (reliable)
            const completedOrders = deliveredOrders.filter(
                o => o.assignedDeliveryBoy?.toString() === boyId
            );
            const completedDeliveries = completedOrders.length;

            // Broadcast/rejection từ DeliveryAssignment
            const totalBroadcasted = assignments.filter(
                a => a.brodcastedTo?.some((id: any) => id.toString() === boyId)
            ).length;
            const totalRejected = assignments.filter(
                a => a.rejectedBy?.some((id: any) => id.toString() === boyId)
            ).length;

            const acceptedOffers = Math.max(0, totalBroadcasted - totalRejected);
            const acceptanceRate = totalBroadcasted > 0
                ? Math.min(100, Math.round((acceptedOffers / totalBroadcasted) * 100))
                : 0;

            // lastDelivery = deliveredAt gần nhất trong Orders
            const lastDelivery = completedOrders.length
                ? completedOrders.sort((a, b) =>
                    new Date(b.deliveredAt ?? 0).getTime() - new Date(a.deliveredAt ?? 0).getTime()
                )[0].deliveredAt ?? null
                : null;

            return {
                _id: boy._id,
                name: boy.name,
                email: boy.email,
                mobile: boy.mobile,
                image: boy.image ?? null,
                isOnline: boy.isOnline,
                completedDeliveries,
                totalBroadcasted,
                totalRejected,
                acceptanceRate,
                totalEarnings: completedOrders.reduce(
                    (sum, o) => sum + (o.shipperEarning || DELIVERY_EARNING_PER_ORDER),
                    0
                ),
                lastDelivery,
            };
        });

        deliveryBoysWithStats.sort((a, b) => b.completedDeliveries - a.completedDeliveries);

        return NextResponse.json({ success: true, deliveryBoys: deliveryBoysWithStats }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch delivery boys' }, { status: 500 });
    }
}
