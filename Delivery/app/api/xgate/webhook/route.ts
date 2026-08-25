import { processXGatePayment, type XGateWebhookPayload } from "@/app/lib/xgate/processXGatePayment";
import { verifyXGateWebhook } from "@/app/lib/xgate/verifyWebhook";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const headerSignature =
        req.headers.get("x-webhook-signature") ??
        req.headers.get("X-Webhook-Signature");

    let bodyChecksum: string | null = null;
    try {
        const parsed = JSON.parse(rawBody) as { checksum?: string };
        bodyChecksum = parsed.checksum ?? null;
    } catch {
        bodyChecksum = null;
    }

    if (!verifyXGateWebhook(rawBody, headerSignature, bodyChecksum)) {
        console.error("[xGate webhook] Invalid signature/checksum", {
            hasHeader: Boolean(headerSignature),
            hasBodyChecksum: Boolean(bodyChecksum),
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const payload = JSON.parse(rawBody) as XGateWebhookPayload;
        console.log("[xGate webhook] received:", {
            id: payload.id,
            transferType: payload.transferType,
            amount: payload.transferAmount ?? payload.amount,
            content: payload.content?.slice(0, 80),
        });

        const result = await processXGatePayment(payload);

        if (!result.handled) {
            console.warn("[xGate webhook] ignored:", result.reason);
        } else {
            console.log("[xGate webhook] success:", result);
        }

        return NextResponse.json({ success: true, ...result }, { status: 200 });
    } catch (error) {
        console.error("XGATE WEBHOOK ERROR:", error);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
}
