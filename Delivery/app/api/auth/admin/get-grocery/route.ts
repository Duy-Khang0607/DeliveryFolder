import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const session = await auth()
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // search query params
        const search = req.nextUrl.searchParams;
        const page = parseInt(search.get('page') || '1');
        const limit = parseInt(search.get('limit') || '10');

        // Skip
        const skip = (page - 1) * limit;


        const q = search.get('q')
        const query = q ? {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        } : {}

        // Total count
        const totalItems = await Grocery.countDocuments(query)  // ← truyền query vào
        const groceries = await Grocery.find(query).skip(skip).limit(limit)

        if (!groceries) {
            return NextResponse.json({ success: false, message: 'Not found groceries items' }, { status: 400 });
        }

        return NextResponse.json({
            success: true, pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                itemsPerPage: limit,
            }, groceries
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed groceries items' }, { status: 500 });
    }
}