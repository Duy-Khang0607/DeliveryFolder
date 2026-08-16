import { fulfillOnlineOrder } from "@/app/lib/fulfillOnlineOrder";
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
            const orderId = session?.metadata?.orderId;

            if (!orderId) {
                return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
            }

            const result = await fulfillOnlineOrder(orderId);

            if (!result.success) {
                console.error(`Webhook fulfill failed for order ${orderId}:`, result.message);
                return NextResponse.json({ error: result.message }, { status: result.status });
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error({ error });
        return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 500 });
    }
}
