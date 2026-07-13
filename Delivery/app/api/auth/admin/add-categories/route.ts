import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Categories from "@/app/models/categories.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        // Connect DB
        await connectDB();

        // Check if user is authenticated
        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        // Get body
        const { name, isActive } = await req.json()

        // Check tồn tại categories
        const existingCategories = await Categories.findOne({ name, isActive });
        if (existingCategories) {
            return NextResponse.json({ success: false, message: 'Categories with this name already exists' }, { status: 400 });
        }

        // Create grocery
        const categories = await Categories.create({ name, isActive });

        return NextResponse.json({ success: true, message: 'Categories created successfully', categories }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Add Categories failed' }, { status: 500 });
    }
}