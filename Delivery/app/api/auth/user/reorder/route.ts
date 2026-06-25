import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Grocery from "@/app/models/grocery.model";
import { NextRequest, NextResponse } from "next/server";

interface ReorderItem {
    groceryId: string
    quantity: number
    name: string
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { items }: { items: ReorderItem[] } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'No items provided' }, { status: 400 });
        }

        const groceryIds = items.map(i => i.groceryId);
        const groceries = await Grocery.find({ _id: { $in: groceryIds } }).lean();

        const available: any[] = [];
        const unavailable: { name: string; reason: string; quantity: number }[] = [];

        for (const item of items) {
            const grocery = groceries.find(g => g._id.toString() === item.groceryId);

            if (!grocery) {
                unavailable.push({ name: item.name, reason: 'No longer available', quantity: item.quantity });
                continue;
            }

            if (grocery.stock < 1) {
                unavailable.push({ name: item.name, reason: 'Out of stock', quantity: item.quantity });
                continue;
            }

            available.push({
                ...grocery,
                _id: grocery._id.toString(),
                quantity: Math.min(Number(item.quantity), grocery.stock),
            });
        }

        return NextResponse.json({ success: true, available, unavailable }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Reorder check failed' }, { status: 500 });
    }
}
