import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB()

        const { id } = await params
        const grocery = await Grocery.findById(id).lean()
        if (!grocery) return NextResponse.json({ success: false }, { status: 404 })

        return NextResponse.json({ success: true, grocery , message: 'Grocery fetched successfully' }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Failed to get grocery' }, { status: 500 });
    }
}