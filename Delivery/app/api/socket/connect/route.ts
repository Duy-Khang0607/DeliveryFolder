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

        const user = await User.findByIdAndUpdate(userId, {
            socketId,
            isOnline: true
        }, { new: true })


        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 400 })
        }

        return NextResponse.json({ success: true }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "API Socket Failed" }, { status: 500 })
    }
}