import { createOrderFromPendingCheckout } from "@/app/lib/createOrderFromPendingCheckout";
import { fulfillExistingOrderPayment } from "@/app/lib/fulfillExistingOrderPayment";
import { fulfillOnlineOrder } from "@/app/lib/fulfillOnlineOrder";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import PendingCheckout from "@/app/models/pendingCheckout.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
    const sig = req.headers.get("stripe-signature") as string;
    const rawBody = await req.text();

    try {
        const event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const pendingCheckoutId = session?.metadata?.pendingCheckoutId;
            const orderId = session?.metadata?.orderId;
            const purpose = session?.metadata?.purpose;

            if (pendingCheckoutId) {
                const result = await createOrderFromPendingCheckout(pendingCheckoutId);

                if (!result.success) {
                    console.error(
                        `Webhook create order failed for pending ${pendingCheckoutId}:`,
                        result.message
                    );
                    return NextResponse.json({ error: result.message }, { status: result.status });
                }
            } else if (orderId) {
                await connectDB();
                const order = await Orders.findById(orderId);
                const isChangeToOnline =
                    purpose === "change_to_online" || order?.paymentMethod === "cod";

                const result = isChangeToOnline
                    ? await fulfillExistingOrderPayment(orderId)
                    : await fulfillOnlineOrder(orderId);

                if (!result.success) {
                    console.error(`Webhook fulfill failed for order ${orderId}:`, result.message);
                    return NextResponse.json({ error: result.message }, { status: result.status });
                }
            } else {
                return NextResponse.json({ error: "Missing checkout metadata" }, { status: 400 });
            }
        }

        if (event.type === "checkout.session.expired") {
            const session = event.data.object as Stripe.Checkout.Session;
            const pendingCheckoutId = session?.metadata?.pendingCheckoutId;
            const orderId = session?.metadata?.orderId;
            const purpose = session?.metadata?.purpose;

            await connectDB();

            if (pendingCheckoutId) {
                await PendingCheckout.findOneAndUpdate(
                    { _id: pendingCheckoutId, status: "pending" },
                    { status: "expired" }
                );
            }

            if (purpose === "change_to_online" && orderId) {
                await Orders.findByIdAndUpdate(orderId, { stripeSessionUrl: null });
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error({ error });
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 500 });
    }
}
