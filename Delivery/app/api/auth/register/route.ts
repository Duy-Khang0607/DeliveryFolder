import { NextRequest, NextResponse } from 'next/server';
import User from '@/app/models/user.model';
import connectDB from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendEmail } from '@/app/lib/mailer';

// API Register
export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();
        await connectDB();

        const existUser = await User.findOne({ $or: [{ name }, { email }] });
        if (existUser) {
            return NextResponse.json({ success: false, message: 'Name or Email already exists' }, { status: 400 });
        }

        if (password?.length < 6) {
            return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        if (!hashedPassword) {
            return NextResponse.json({ success: false, message: 'Failed to hash password' }, { status: 400 });
        }

        // Tạo verification token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
            isEmailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        });

        if (!newUser) {
            return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 400 });
        }

        // Gửi email xác nhận
        const verifyUrl = `${process.env.NEXT_BASE_URL}/verify-email?token=${rawToken}`;
        await sendEmail(
            email,
            'Verify your email — Delivery App',
            `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #16a34a;">Welcome to Delivery App! 🎉</h2>
                <p>Hi <strong>${name}</strong>, thanks for registering.</p>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="${verifyUrl}"
                   style="display: inline-block; margin: 16px 0; padding: 12px 24px;
                          background: #16a34a; color: white; border-radius: 8px;
                          text-decoration: none; font-weight: bold;">
                    Verify Email
                </a>
                <p style="color: #6b7280; font-size: 13px;">This link expires in <strong>24 hours</strong>.</p>
                <p style="color: #6b7280; font-size: 13px;">If you didn't create an account, please ignore this email.</p>
            </div>
            `
        );

        return NextResponse.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            email,
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
