import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Units from "@/app/models/units.model";
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
        const totalItems = await Units.countDocuments(query)  // ← truyền query vào
        const units = await Units.find(query).skip(skip).limit(limit)

        if (!units) {
            return NextResponse.json({ success: false, message: 'Not found units items' }, { status: 400 });
        }

        return NextResponse.json({
            success: true, pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                itemsPerPage: limit,
            }, units
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed units items' }, { status: 500 });
    }
}