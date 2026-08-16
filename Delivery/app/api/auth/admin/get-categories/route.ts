import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Categories from "@/app/models/categories.model";
import { NextRequest, NextResponse } from "next/server";

const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const session = await auth();
        if (!session || session?.user?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const search = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(search.get("page") || "1", 10));
        const limit = Math.min(Math.max(1, parseInt(search.get("limit") || "20", 10)), MAX_LIMIT);
        const skip = (page - 1) * limit;
        const q = search.get("q")?.trim();
        const activeOnly = search.get("activeOnly") === "true";

        const filters: Record<string, unknown>[] = [];
        if (q) {
            filters.push({ name: { $regex: q, $options: "i" } });
        }
        if (activeOnly) {
            filters.push({ isActive: true });
        }

        const query = filters.length > 0 ? { $and: filters } : {};

        const [totalItems, categories] = await Promise.all([
            Categories.countDocuments(query),
            Categories.find(query)
                .select("name isActive order")
                .sort({ order: 1, name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        return NextResponse.json({
            success: true,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: limit,
            },
            categories,
        }, { status: 200 });

    } catch {
        return NextResponse.json({ success: false, message: "Get failed categories items" }, { status: 500 });
    }
}
