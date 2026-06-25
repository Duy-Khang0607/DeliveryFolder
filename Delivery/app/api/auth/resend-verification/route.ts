import crypto from 'crypto';
import connectDB from '@/app/lib/db';
import { sendEmail } from '@/app/lib/mailer';
import User from '@/app/models/user.model';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Generic response - tránh email enumeration
            return NextResponse.json({ success: true, message: 'If this email exists, a verification link has been sent.' }, { status: 200 });
        }

        if (user.isEmailVerified) {
            return NextResponse.json({ success: false, message: 'Email is already verified' }, { status: 400 });
        }

        // Rate limit: block nếu token được tạo < 60 giây trước
        if (user.emailVerificationExpires) {
            const tokenCreatedAt = user.emailVerificationExpires.getTime() - 24 * 60 * 60 * 1000
            const secondsSinceCreation = (Date.now() - tokenCreatedAt) / 1000
            if (secondsSinceCreation < 60) {
                return NextResponse.json({ success: false, message: 'Please wait 1 minute before requesting again.' }, { status: 429 });
            }
        }

        // Tạo token mới
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        const verifyUrl = `${process.env.NEXT_BASE_URL}/verify-email?token=${rawToken}`;
        await sendEmail(
            email,
            'Verify your email — Delivery App',
            `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #16a34a;">Verify your email 📧</h2>
                <p>Click the button below to verify your email address:</p>
                <a href="${verifyUrl}"
                   style="display: inline-block; margin: 16px 0; padding: 12px 24px;
                          background: #16a34a; color: white; border-radius: 8px;
                          text-decoration: none; font-weight: bold;">
                    Verify Email
                </a>
                <p style="color: #6b7280; font-size: 13px;">This link expires in <strong>24 hours</strong>.</p>
            </div>
            `
        );

        return NextResponse.json({ success: true, message: 'Verification email sent!' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
