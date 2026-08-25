import { NextRequest, NextResponse } from "next/server";

// Stripe đã chuyển sang xGate — giữ code cũ để tham khảo
/*
import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { createOrderFromPendingCheckout } from "@/app/lib/createOrderFromPendingCheckout";
import { fulfillExistingOrderPayment } from "@/app/lib/fulfillExistingOrderPayment";
import { fulfillOnlineOrder } from "@/app/lib/fulfillOnlineOrder";
import Orders from "@/app/models/orders.model";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ success: false, message: "sessionId is required" }, { status: 400 });
        }

        let stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

        for (let i = 0; i < 5 && stripeSession.payment_status !== "paid"; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        }

        if (stripeSession.payment_status !== "paid") {
            return NextResponse.json({ success: false, message: "Payment not completed" }, { status: 400 });
        }

        const pendingCheckoutId = stripeSession.metadata?.pendingCheckoutId;
        const orderId = stripeSession.metadata?.orderId;
        const purpose = stripeSession.metadata?.purpose;

        await connectDB();

        if (pendingCheckoutId) {
            const pendingResult = await createOrderFromPendingCheckout(pendingCheckoutId);

            if (!pendingResult.success) {
                return NextResponse.json(
                    { success: false, message: pendingResult.message },
                    { status: pendingResult.status }
                );
            }

            const order = pendingResult.order;
            if (order.user.toString() !== session.user.id) {
                return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
            }

            return NextResponse.json(
                {
                    success: true,
                    message: pendingResult.alreadyFulfilled ? "Order already fulfilled" : "Payment confirmed",
                    alreadyFulfilled: pendingResult.alreadyFulfilled,
                    orderId: order._id,
                },
                { status: 200 }
            );
        }

        if (!orderId) {
            return NextResponse.json({ success: false, message: "Missing checkout metadata" }, { status: 400 });
        }

        const order = await Orders.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const isChangeToOnline =
            purpose === "change_to_online" || order.paymentMethod === "cod";

        const result = isChangeToOnline
            ? await fulfillExistingOrderPayment(orderId)
            : await fulfillOnlineOrder(orderId);

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message }, { status: result.status });
        }

        return NextResponse.json(
            {
                success: true,
                message: result.alreadyFulfilled ? "Order already fulfilled" : "Payment confirmed",
                alreadyFulfilled: result.alreadyFulfilled,
                orderId: result.order._id,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("CONFIRM PAYMENT ERROR:", error);
        return NextResponse.json({ success: false, message: "Failed to confirm payment" }, { status: 500 });
    }
}
*/

export async function POST(_req: NextRequest) {
    return NextResponse.json(
        { success: false, message: "Stripe payment is disabled. Use xGate." },
        { status: 410 }
    );
}
