import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const internalSecret = req.headers.get('x-internal-secret')
        if (internalSecret !== process.env.INTERNAL_API_SECRET) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { userId, socketId } = await req.json()

        if (!userId || !socketId) {
            return NextResponse.json({ success: false, message: "Missing userId or socketId" }, { status: 400 })
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, socketId },
            { socketId: null, isOnline: false },
            { new: true }
        )

        if (!user) {
            // Socket cũ disconnect sau reload — user đã reconnect với socketId mới
            return NextResponse.json({ success: true, stale: true, message: "Stale socket disconnect ignored" }, { status: 200 })
        }

        return NextResponse.json({ success: true, message: "User disconnected", user: { name: user?.name, role: user?.role } }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "API Socket Failed" }, { status: 500 })
    }
}