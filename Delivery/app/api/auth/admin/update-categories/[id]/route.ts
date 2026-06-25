import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Categories from "@/app/models/categories.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await connectDB();

        const session = await auth();
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
        }

        const { id } = await params

        if (!id) {
            return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
        }

        const body = await req.json()
        const { _id, name, isActive, icon, color, order, createdAt } = body

        // Validate: phải có ít nhất 1 field để update
        if (name === undefined && isActive === undefined && icon === undefined && color === undefined && order === undefined) {
            return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
        }

        // Build update object — chỉ update fields được gửi lên
        const updateData: Record<string, any> = {}
        if (name !== undefined) {
            updateData.name = name
        }
        if (isActive !== undefined) updateData.isActive = isActive
        if (icon !== undefined) updateData.icon = icon
        if (color !== undefined) updateData.color = color
        if (order !== undefined) updateData.order = order
        if (createdAt !== undefined) updateData.createdAt = createdAt

        const categories = await Categories.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        )

        if (!categories) {
            return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
        }

        await emitEventHandler('categories-updated', { categories })

        return NextResponse.json({ success: true, message: 'Category updated successfully', categories }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Update category failed' }, { status: 500 });
    }
}