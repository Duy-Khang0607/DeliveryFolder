import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { buildVietQrUrl } from "@/app/lib/xgate/generateVietQR";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await context.params;
        await connectDB();

        const order = await Orders.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const isPaid = Boolean(order.isPaid);
        const qrUrl = order.transferCode
            ? buildVietQrUrl({
                  amount: order.totalAmount,
                  description: order.transferCode,
              })
            : order.paymentQrUrl;

        return NextResponse.json(
            {
                status: isPaid ? "completed" : "pending",
                orderId: order._id.toString(),
                qrUrl,
                transferCode: order.transferCode,
                amount: order.totalAmount,
                isPaid,
                paymentMethod: order.paymentMethod,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("ORDER PAYMENT STATUS ERROR:", error);
        return NextResponse.json({ success: false, message: "Failed to get payment status" }, { status: 500 });
    }
}
