import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Message from "@/app/models/message.model";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const internalSecret = req.headers.get('x-internal-secret')
        const isInternalCall = internalSecret === process.env.INTERNAL_API_SECRET

        if (!isInternalCall) {
            const session = await auth()
            if (!session?.user) {
                return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
            }
        }

        // const session = await auth()
        // if (!session?.user) {
        //     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        // }

        const { roomId, text, senderId, time, messageId } = await req.json();

        const room = await Orders.findById(roomId);

        if (!room) {
            return NextResponse.json({ success: false, message: "Room not found" }, { status: 400 });
        }

        // Kiểm tra message đã lưu chưa
        if (messageId) {
            const existingMsg = await Message.findOne({ messageId });
            if (existingMsg) {
                return NextResponse.json({ success: true, message: "Already saved", messages: existingMsg }, { status: 200 });
            }
        }

        const messages = await Message.create({ roomId, text, senderId, time, messageId })

        return NextResponse.json({ success: true, message: "Chat message saved successfully", messages }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: "Save chat message failed" }, { status: 500 });
    }
}