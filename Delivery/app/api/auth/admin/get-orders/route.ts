import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const search = req.nextUrl.searchParams;
        const page = parseInt(search.get('page') || '1');
        const limit = parseInt(search.get('limit') || '10');

        const skip = (page - 1) * limit;

        const session = await auth()

        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // Thêm đọc status param
        const status = search.get('status')
        // Thêm status vào query
        const query = {
            ...(status ? { status } : {})  // filter nếu có status
        }

        const totalItems = await Orders?.countDocuments(query);

        const orders = await Orders.find(query).populate('user assignedDeliveryBoy').sort({ createdAt: -1 }).lean().skip(skip).limit(limit);

        if (!orders) {
            return NextResponse.json({ success: false, message: 'Not found orders items' }, { status: 400 });
        }
        return NextResponse.json({
            success: true, pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                itemsPerPage: limit,
            }, orders
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed order items' }, { status: 500 });
    }
}