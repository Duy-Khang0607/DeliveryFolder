import crypto from 'crypto'
import connectDB from "@/app/lib/db"
import { sendEmail } from "@/app/lib/mailer"
import User from "@/app/models/user.model"
import { NextRequest, NextResponse } from "next/server"


const GENERIC_RESPONSE = { success: true, message: "If this email exists, a reset link has been sent." }

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
        }

        const user = await User.findOne({ email })

        // Trả về cùng response dù email có tồn tại hay không → tránh email enumeration
        if (!user) return NextResponse.json(GENERIC_RESPONSE, { status: 200 })

        // Rate limit: không gửi lại nếu token chưa đến 1 phút
        if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() - Date.now() > 59 * 60 * 1000) {
            return NextResponse.json({ success: false, message: "Please wait before requesting again." }, { status: 429 })
        }

        // Tạo token ngẫu nhiên 32 bytes
        const rawToken = crypto.randomBytes(32).toString('hex')

        // Hash token trước khi lưu DB (bảo vệ khi DB bị breach)
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

        // Lưu vào DB, hết hạn sau 15 phút
        user.resetPasswordToken = hashedToken
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000)
        await user.save()

        // Gửi email với RAW token (không hash) trong URL
        const resetUrl = `${process.env.NEXT_BASE_URL}/reset-password?token=${rawToken}`

        await sendEmail(
            user.email,
            "Reset your password",
            `<h2>Reset Password</h2>
             <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
             <p>This link expires in <strong>15 minutes</strong>.</p>
             <p>If you didn't request this, please ignore this email.</p>`
        )
        return NextResponse.json(GENERIC_RESPONSE, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
    }
}