import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        // search query params
        const search = req.nextUrl.searchParams;
        const page = parseInt(search.get('page') || '1');
        const limit = parseInt(search.get('limit') || '10');

        // Skip
        const skip = (page - 1) * limit;

        // Total count
        const totalItems = await Grocery?.countDocuments({});

        const groceries = await Grocery?.find({}).lean().skip(skip).limit(limit);

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