import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import connectDB from "@/app/lib/db"
import User from "@/app/models/user.model"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ success: false, message: "Token and password are required" }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ success: false, message: "Password must be at least 6 characters" }, { status: 400 })
        }

        // Hash token nhận từ URL để so sánh với DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        // Tìm user với token hợp lệ và chưa hết hạn
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }  // chưa hết hạn
        })

        if (!user) {
            return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 400 })
        }

        // Hash password mới
        const hashedPassword = await bcrypt.hash(password, 10)

        // Cập nhật password, xóa reset token, đánh dấu email đã verified
        // (vì user đã nhận được email reset → email hợp lệ)
        user.password = hashedPassword
        user.resetPasswordToken = null
        user.resetPasswordExpires = null
        user.isEmailVerified = true
        await user.save()

        return NextResponse.json({ success: true, message: "Password reset successfully" }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
    }
}