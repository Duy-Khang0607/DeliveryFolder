import crypto from 'crypto';
import connectDB from '@/app/lib/db';
import User from '@/app/models/user.model';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const token = req.nextUrl.searchParams.get('token');

        if (!token) {
            return NextResponse.json({ success: false, message: 'Token is required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json({ success: false, message: 'Invalid or expired verification link' }, { status: 400 });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        return NextResponse.json({ success: true, message: 'Email verified successfully! You can now log in.' }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
