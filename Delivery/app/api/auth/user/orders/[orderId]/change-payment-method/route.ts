import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const CHECKOUT_EXPIRES_MINUTES = 30;

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

        // COD → Online
        if (targetMethod === "online") {
            if (order.paymentMethod !== "cod" || order.isPaid) {
                return NextResponse.json(
                    { success: false, message: "Only unpaid COD orders can switch to online payment" },
                    { status: 400 }
                );
            }

            if (order.stripeSessionUrl) {
                return NextResponse.json({ url: order.stripeSessionUrl }, { status: 200 });
            }

            const expiresAt = Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_MINUTES * 60;

            const stripeSession = await stripe.checkout.sessions.create(
                {
                    payment_method_types: ["card"],
                    mode: "payment",
                    success_url: `${process.env.NEXT_BASE_URL}/user/order-success?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.NEXT_BASE_URL}/user/my-orders`,
                    expires_at: expiresAt,
                    line_items: [
                        {
                            price_data: {
                                currency: "vnd",
                                product_data: {
                                    name: `Order #${order._id.toString().slice(-6)}`,
                                },
                                unit_amount: Math.round(order.totalAmount),
                            },
                            quantity: 1,
                        },
                    ],
                    metadata: {
                        orderId: order._id.toString(),
                        purpose: "change_to_online",
                    },
                },
                { idempotencyKey: `change-to-online-${order._id.toString()}-${Date.now()}` }
            );

            await Orders.findByIdAndUpdate(order._id, {
                stripeSessionUrl: stripeSession.url,
            });

            return NextResponse.json({ url: stripeSession.url }, { status: 200 });
        }

        // Online (unpaid) → COD — edge case đơn cũ
        if (targetMethod === "cod") {
            if (order.paymentMethod !== "online" || order.isPaid) {
                return NextResponse.json(
                    { success: false, message: "Paid online orders cannot switch to COD" },
                    { status: 400 }
                );
            }

            const updated = await Orders.findByIdAndUpdate(
                orderId,
                { paymentMethod: "cod", stripeSessionUrl: null },
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
