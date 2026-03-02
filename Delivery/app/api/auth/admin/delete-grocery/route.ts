import { auth } from "@/app/auth";
import uploadOnCloudinary from "@/app/lib/cloudinary";
import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
    try {

        // connect DB
        await connectDB();

        // check if user is authenticated
        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        // get body
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        // delete grocery
        const grocery = await Grocery?.findByIdAndDelete(id?.toString())?.lean();
        if (!grocery) {
            return NextResponse.json({ success: false, message: 'Grocery not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Grocery deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Add grocery failed' }, { status: 500 });
    }
}