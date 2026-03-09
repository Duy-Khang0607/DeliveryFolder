import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const { userId } = await req.json()

        const user = await User.findByIdAndUpdate(userId, {
            socketId: null,
            isOnline: false
        }, { new: true })

        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: "User disconnected" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "API Socket Failed" }, { status: 500 })
    }
}