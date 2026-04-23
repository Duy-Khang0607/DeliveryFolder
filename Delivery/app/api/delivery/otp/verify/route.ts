

import { auth } from "@/app/auth"
import connectDB from "@/app/lib/db"
import { emitEventHandler } from "@/app/lib/emitEventHandler"
import { sendEmail } from "@/app/lib/mailer"
import DeliveryAssignment from "@/app/models/deliveryAssignment.model"
import Orders from "@/app/models/orders.model"
import { NextRequest, NextResponse } from "next/server"


export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, otp } = await req.json()

        if (!orderId || !otp) {
            return NextResponse.json({ success: false, message: "Please send all required fields" }, { status: 400 })
        }

        const order = await Orders.findById(orderId).populate('user')

        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 })
        }

        if (order.deliveryOTP !== otp) {
            return NextResponse.json({ success: false, message: "Incorrect OTP or expired" }, { status: 400 })
        }

        order.status = 'Delivered'
        order.deliveryOTPVerification = true
        order.deliveredAt = new Date()
        await order.save()

        await emitEventHandler("order-status-updated", { orderId: order._id, status: order.status, assignment: order.assignment })

        await DeliveryAssignment.updateOne(
            { order: orderId },
            { $set: { status: 'completed', assignedTo: null } }
        )

        await emitEventHandler("order-delivered", { orderId: order._id, success: true, message: "Order delivered successfully" })

        try {
            if (order?.user && order?.user?.email) {
                await sendEmail(
                    order?.user?.email,
                    "Order Delivered - Delivery App #" + String(order?._id)?.slice(-6),
                    `<h2>Your order has been delivered successfully! 🎉</h2>
                    <p>Order ID: <strong>#${String(order?._id)?.slice(-6)}</strong></p>
                    <p>Delivered at: <strong>${new Date(order?.deliveredAt)?.toLocaleString("vi-VN", {
                        timeZone: "Asia/Ho_Chi_Minh",
                        hour12: false,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    })}</strong></p>
                    <p>Thank you for using our service !</p>`
                )
            }
        } catch (emailError) {
            console.error('Failed to send delivery notification email:', emailError)
        }

        return NextResponse.json({ success: true, message: "OTP verified successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "Verification of OTP failed" }, { status: 500 })
    }
}