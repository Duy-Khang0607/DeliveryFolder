import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Units from "@/app/models/units.model";

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
        const { name } = await req.json()

        // Check tồn tại units
        const existingUnits = await Units.findOne({ name });
        if (existingUnits) {
            return NextResponse.json({ success: false, message: 'Units with this name already exists' }, { status: 400 });
        }

        // Create units
        const units = await Units.create({ name });

        return NextResponse.json({ success: true, message: 'Units created successfully', units }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Add Units failed' }, { status: 500 });
    }
}