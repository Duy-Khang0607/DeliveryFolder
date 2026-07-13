import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import DeliveryAssignment from "@/app/models/deliveryAssignment.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextResponse } from "next/server";

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

        // Shipper đang bận: đang có assignment status 'assigned'
        const busyIds = await DeliveryAssignment.find({
            assignedTo: { $in: ids },
            status: 'assigned',
        }).distinct('assignedTo');

        const busyIdSet = new Set(busyIds.map(id => String(id)));

        // Số đơn hoàn thành từ Orders
        const deliveredOrders = await Orders.find({
            assignedDeliveryBoy: { $in: ids },
            status: 'Delivered',
        }).select('assignedDeliveryBoy').lean();

        const deliveryBoysWithStatus = deliveryBoys.map(boy => {
            const boyId = boy._id.toString();
            const isAvailable = boy.isOnline && !busyIdSet.has(boyId);
            const completedDeliveries = deliveredOrders.filter(
                o => o.assignedDeliveryBoy?.toString() === boyId
            ).length;

            return {
                _id: boy._id,
                name: boy.name,
                mobile: boy.mobile ?? null,
                image: boy.image ?? null,
                isOnline: boy.isOnline,
                isAvailable,
                completedDeliveries,
            };
        });

        // Sắp xếp: available online → online busy → offline
        deliveryBoysWithStatus.sort((a, b) => {
            if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
            if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
            return b.completedDeliveries - a.completedDeliveries;
        });

        return NextResponse.json({ success: true, deliveryBoys: deliveryBoysWithStatus }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch available delivery boys' }, { status: 500 });
    }
}
