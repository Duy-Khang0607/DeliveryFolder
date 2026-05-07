import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
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

        // delete user
        const user = await User?.findByIdAndDelete(id?.toString())?.lean();
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Delete user failed' }, { status: 500 });
    }
}