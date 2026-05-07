import { auth } from "@/app/auth"
import connectDB from "@/app/lib/db"
import { sendEmail } from "@/app/lib/mailer"
import Orders from "@/app/models/orders.model"
import { NextRequest, NextResponse } from "next/server"


export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { orderId } = await req.json()

        const order = await Orders.findById(orderId).populate('user assignedDeliveryBoy')

        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
        }

        if (!order.assignedDeliveryBoy) {
            return NextResponse.json({ success: false, message: "No delivery boy assigned to this order" }, { status: 400 })
        }

        // Kiểm tra OTP đã được gửi trong vòng 60 giây, không gửi lại
        if (order?.otpSentAt && (Date.now() - new Date(order?.otpSentAt).getTime()) < 60_000) {
            return NextResponse.json({ success: false, message: 'Please wait 60 seconds before resending.' }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000)

        order.deliveryOTP = otp.toString()
        order.otpSentAt = new Date();
        await order.save()

        await sendEmail(order.assignedDeliveryBoy.email, "Your delivery OTP", `<h2> Your delivery OTP is <strong>${otp}</strong></h2>`)

        return NextResponse.json({ success: true, message: "OTP sent successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "OTP sending failed" }, { status: 500 })
    }
}