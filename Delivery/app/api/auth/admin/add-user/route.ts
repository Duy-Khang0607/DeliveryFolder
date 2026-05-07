import { auth } from "@/app/auth";
import uploadOnCloudinary from "@/app/lib/cloudinary";
import connectDB from "@/app/lib/db";
import User from "@/app/models/user.model";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {

        // Connect DB
        await connectDB();

        // Check if user is authenticated
        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        // Get body
        const formData = await req.formData();
        const name = formData.get('name') as string;
        const password = formData.get('password') as string;
        const email = formData.get('email') as string;
        const mobile = formData.get('mobile') as string;
        const role = formData.get('role') as string;
        const file = formData.get('image') as Blob | null;

        let imageUrls;
        if (file) {
            imageUrls = await uploadOnCloudinary(file);
            if (!imageUrls) {
                return NextResponse.json({ success: false, message: 'Failed to upload image' }, { status: 400 });
            }
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ success: false, message: 'User with this email already exists' }, { status: 400 });
        }

        // Check if password is at least 6 characters long
        if (password?.length < 6) {
            return NextResponse.json({ success: false, message: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        if (!hashedPassword) {
            return NextResponse.json({ success: false, message: 'Failed to hash password' }, { status: 400 });
        }
        const user = await User.create({ name, password: hashedPassword, email, mobile, role, image: imageUrls });

        return NextResponse.json({ success: true, message: 'User created successfully', user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Add user failed' }, { status: 500 });
    }
}