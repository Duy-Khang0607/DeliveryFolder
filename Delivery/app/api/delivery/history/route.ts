import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user || (session.user as any)?.role !== "deliveryBoy") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const search = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(search.get("page") || "1", 10));
        const limit = Math.min(20, Math.max(1, parseInt(search.get("limit") || "8", 10)));
        const skip = (page - 1) * limit;
        const scope = search.get("scope") || "today";

        const deliveryBoyId = session.user.id;

        const query: Record<string, unknown> = {
            assignedDeliveryBoy: deliveryBoyId,
            status: "Delivered",
        };

        if (scope === "today") {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            query.deliveredAt = { $gte: startOfToday };
        }

        const totalItems = await Orders.countDocuments(query);

        const earningsResult = await Orders.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$shipperEarning', 0] } } } },
        ]);

        const orders = await Orders.find(query)
            .sort({ deliveredAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("user", "name email mobile")
            .lean();

        const totalEarnings = earningsResult[0]?.total ?? 0;

        return NextResponse.json({
            success: true,
            orders,
            summary: {
                completedDeliveries: totalItems,
                totalEarnings,
            },
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit) || 1,
                totalItems,
                itemsPerPage: limit,
            },
        }, { status: 200 });
    } catch {
        return NextResponse.json({ success: false, message: "Failed to fetch delivery history" }, { status: 500 });
    }
}
