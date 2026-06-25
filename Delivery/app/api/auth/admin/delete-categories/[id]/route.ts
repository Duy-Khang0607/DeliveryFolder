import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Categories from "@/app/models/categories.model";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {

        // connect DB
        await connectDB();

        // check if user is authenticated
        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        // get body
        const { id } = await params
        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        // delete user
        const categories = await Categories?.findByIdAndDelete(id?.toString())?.lean();
        if (!categories) {
            return NextResponse.json({ success: false, message: 'Categories not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, message: 'Categories deleted successfully' }, { status: 200 });
        
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Delete categories failed' }, { status: 500 });
    }
}