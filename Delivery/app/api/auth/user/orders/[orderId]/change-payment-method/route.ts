import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { buildOrderTransferCode } from "@/app/lib/xgate/buildTransferCode";
import { CHECKOUT_EXPIRES_MINUTES } from "@/app/lib/xgate/config";
import { buildVietQrUrl } from "@/app/lib/xgate/generateVietQR";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
    try {
        await connectDB();

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { orderId } = await context.params;
        const { targetMethod } = await req.json();

        if (!targetMethod || !["online", "cod"].includes(targetMethod)) {
            return NextResponse.json({ success: false, message: "Invalid target payment method" }, { status: 400 });
        }

        const order = await Orders.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "Pending") {
            return NextResponse.json(
                { success: false, message: "Only pending orders can change payment method" },
                { status: 400 }
            );
        }

        if (order.paymentMethod === targetMethod) {
            return NextResponse.json(
                { success: false, message: "Order already uses this payment method" },
                { status: 400 }
            );
        }

        if (targetMethod === "online") {
            if (order.paymentMethod !== "cod" || order.isPaid) {
                return NextResponse.json(
                    { success: false, message: "Only unpaid COD orders can switch to online payment" },
                    { status: 400 }
                );
            }

            if (order.paymentQrUrl && order.transferCode) {
                const expiresAt = new Date(Date.now() + CHECKOUT_EXPIRES_MINUTES * 60 * 1000);
                return NextResponse.json(
                    {
                        orderId: order._id.toString(),
                        qrUrl: order.paymentQrUrl,
                        transferCode: order.transferCode,
                        amount: order.totalAmount,
                        expiresAt,
                    },
                    { status: 200 }
                );
            }

            const transferCode = buildOrderTransferCode(order._id.toString());
            const qrUrl = buildVietQrUrl({
                amount: order.totalAmount,
                description: transferCode,
            });
            const expiresAt = new Date(Date.now() + CHECKOUT_EXPIRES_MINUTES * 60 * 1000);

            await Orders.findByIdAndUpdate(order._id, {
                transferCode,
                paymentQrUrl: qrUrl,
                stripeSessionUrl: null,
            });

            return NextResponse.json(
                {
                    orderId: order._id.toString(),
                    qrUrl,
                    transferCode,
                    amount: order.totalAmount,
                    expiresAt,
                },
                { status: 200 }
            );
        }

        if (targetMethod === "cod") {
            if (order.paymentMethod !== "online" || order.isPaid) {
                return NextResponse.json(
                    { success: false, message: "Paid online orders cannot switch to COD" },
                    { status: 400 }
                );
            }

            const updated = await Orders.findByIdAndUpdate(
                orderId,
                {
                    paymentMethod: "cod",
                    stripeSessionUrl: null,
                    paymentQrUrl: null,
                    transferCode: null,
                },
                { new: true }
            );

            return NextResponse.json(
                {
                    success: true,
                    message: "Payment method changed to COD",
                    order: {
                        paymentMethod: updated?.paymentMethod,
                        isPaid: updated?.isPaid,
                    },
                },
                { status: 200 }
            );
        }

        return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
    } catch (error) {
        console.error("CHANGE PAYMENT METHOD ERROR:", error);
        return NextResponse.json({ success: false, message: "Failed to change payment method" }, { status: 500 });
    }
}
