import { auth } from "@/app/auth";
import { resolveGroceryImage } from "@/app/lib/cloudinary";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Grocery from "@/app/models/grocery.model";
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
        const category = formData.get('category') as string;
        const unit = formData.get('unit') as string;
        const price = formData.get('price') as string;
        const file = formData.get('image') as Blob | null;
        const imageUrl = formData.get('imageUrl') as string | null;
        const stock = formData.get('stock') as string;

        const uploadedImage = await resolveGroceryImage(file, imageUrl);
        if ((file || imageUrl) && !uploadedImage) {
            return NextResponse.json({ success: false, message: 'Failed to upload image' }, { status: 400 });
        }

        const existingGrocery = await Grocery.findOne({ name });
        if (existingGrocery) {
            return NextResponse.json({ success: false, message: 'Grocery with this name already exists' }, { status: 400 });
        }

        const grocery = await Grocery.create({
            name, category, price, unit,
            image: uploadedImage ? [uploadedImage] : [],
            stock,
        });

        await emitEventHandler('grocery-created', { grocery: grocery })

        return NextResponse.json({ success: true, message: 'Grocery created successfully', grocery }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Add grocery failed' }, { status: 500 });
    }
}