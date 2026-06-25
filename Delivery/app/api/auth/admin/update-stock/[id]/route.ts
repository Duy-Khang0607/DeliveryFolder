import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const session = await auth();
        if (!session || (session?.user as any)?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { id } = await params;
        const { stock } = await req.json();

        if (typeof stock !== 'number' || stock < 0) {
            return NextResponse.json({ success: false, message: 'Invalid stock value' }, { status: 400 });
        }

        const grocery = await Grocery.findByIdAndUpdate(
            id,
            { stock },
            { new: true }
        );

        if (!grocery) {
            return NextResponse.json({ success: false, message: 'Grocery not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, stock: grocery.stock }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Update stock failed' }, { status: 500 });
    }
}
