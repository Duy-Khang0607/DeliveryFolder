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


        const q = search.get('q')
        const category = search.get('category')

        const query: Record<string, unknown> = {}

        if (category) {
            query.category = category
        }

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        }

        // Total count
        const totalItems = await Grocery?.countDocuments(query);
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