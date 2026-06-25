import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { normalizeText } from "@/app/lib/normalizeText";
import Categories from "@/app/models/categories.model";
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
            ]
        } : {}

        // Total count
        const totalItems = await Categories.countDocuments(query)  // ← truyền query vào
        const categories = await Categories.find(query).skip(skip).limit(limit)

        if (!categories) {
            return NextResponse.json({ success: false, message: 'Not found categories items' }, { status: 400 });
        }

        return NextResponse.json({
            success: true, pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                itemsPerPage: limit,
            }, categories
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed categories items' }, { status: 500 });
    }
}