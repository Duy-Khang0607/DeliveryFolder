import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        // get search params
        const search = req.nextUrl.searchParams;

        // get page and limit
        const page = parseInt(search.get('page') || '1');

        // get limit
        const limit = parseInt(search.get('limit') || '10');

        // get skip
        const skip = (page - 1) * limit;

        // get session
        const session = await auth()

        // get total items
        const totalItems = await Orders?.countDocuments({user: session?.user?.id});

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const orders = await Orders.find({ user: session?.user?.id }).populate('user assignedDeliveryBoy').sort({ createdAt: -1 }).lean().skip(skip).limit(limit);

        if (!orders) {
            return NextResponse.json({ success: false, message: 'Orders not found' }, { status: 404 });
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
        return NextResponse.json({ success: false, message: 'Get all orders errors' }, { status: 500 });
    }
}