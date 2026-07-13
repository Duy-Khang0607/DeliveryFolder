import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const search = req.nextUrl.searchParams;
        const page = parseInt(search.get('page') || '1');
        const limit = parseInt(search.get('limit') || '8');
        const skip = (page - 1) * limit;

        const query = { assignedDeliveryBoy: id, status: 'Delivered' };

        const totalItems = await Orders.countDocuments(query);

        const orders = await Orders.find(query)
            .sort({ deliveredAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email mobile')
            .lean();

        return NextResponse.json({
            success: true,
            orders,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            }
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch delivery history' }, { status: 500 });
    }
}
