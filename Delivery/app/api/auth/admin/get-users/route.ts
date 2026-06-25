import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const session = await auth()
        if (!session?.user || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const search = req.nextUrl.searchParams;
        const page = parseInt(search.get('page') || '1');
        const limit = parseInt(search.get('limit') || '10');

        const skip = (page - 1) * limit;

        const q = search.get('q')
        const query = q ? {
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } }
            ]
        } : {}

        const totalItems = await User?.countDocuments(query);
        const users = await User?.find(query).lean().select('-password').skip(skip).limit(limit);

        if (!users) {
            return NextResponse.json({ success: false, message: 'Not found users !' }, { status: 400 });
        }

        return NextResponse.json({
            success: true, pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems: totalItems,
                itemsPerPage: limit,
            }, users
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Get failed users !' }, { status: 500 });
    }
}