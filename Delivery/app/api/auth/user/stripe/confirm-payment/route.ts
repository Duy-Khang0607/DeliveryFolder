import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { fulfillOnlineOrder } from "@/app/lib/fulfillOnlineOrder";
import Orders from "@/app/models/orders.model";
import { NextRequest, NextResponse } from "next/server";
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

        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

        if (stripeSession.payment_status !== "paid") {
            return NextResponse.json({ success: false, message: "Payment not completed" }, { status: 400 });
        }

        const orderId = stripeSession.metadata?.orderId;
        if (!orderId) {
            return NextResponse.json({ success: false, message: "Missing orderId in session" }, { status: 400 });
        }

        await connectDB();

        const order = await Orders.findById(orderId).select("user");
        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        if (order.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const result = await fulfillOnlineOrder(orderId);

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            message: result.alreadyFulfilled ? "Order already fulfilled" : "Payment confirmed",
            alreadyFulfilled: result.alreadyFulfilled,
        }, { status: 200 });

    } catch (error) {
        console.error("CONFIRM PAYMENT ERROR:", error);
        return NextResponse.json({ success: false, message: "Failed to confirm payment" }, { status: 500 });
    }
}
