import { auth } from "@/app/auth";
import uploadOnCloudinary from "@/app/lib/cloudinary";
import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const formData = await req.formData();
        const getString = (key: string) => formData.get(key) as string;

        const _id = getString('_id');
        const file = formData.get('image') as Blob | null;
        const locationRaw = getString('location');

        const updateData: Record<string, unknown> = {
            name: getString('name'),
            password: getString('password'),
            email: getString('email'),
            mobile: getString('mobile'),
            role: getString('role'),
            socketId: getString('socketId') || null,
            isOnline: getString('isOnline') === 'true',
            location: locationRaw ? JSON.parse(locationRaw) : undefined,
        };

        if (file) {
            const imageUrl = await uploadOnCloudinary(file);
            if (!imageUrl) {
                return NextResponse.json({ success: false, message: 'Failed to upload image' }, { status: 400 });
            }
            updateData.image = imageUrl;
        }

        const existingUser = await User.findOne({ email: getString('email'), _id: { $ne: _id } });
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
        }

        const rawPassword = getString('password');
        if (rawPassword?.length < 6) {
            return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        updateData.password = await bcrypt.hash(rawPassword, 10);

        const user = await User.findByIdAndUpdate(_id, updateData, { new: true });
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'User updated successfully', user }, { status: 200 });
    } catch (error) {
        console.error({ error });
        return NextResponse.json({ success: false, message: 'Update user failed' }, { status: 500 });
    }
}