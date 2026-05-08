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

        await User.updateMany({}, { isOnline: false, socketId: null })

        return NextResponse.json({ success: true, message: 'All users reset to offline' }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Reset all users failed' }, { status: 500 })
    }
}
