import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { buildVietQrUrl } from "@/app/lib/xgate/generateVietQR";
import PendingCheckout from "@/app/models/pendingCheckout.model";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ pendingCheckoutId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { pendingCheckoutId } = await context.params;
        await connectDB();

        const pending = await PendingCheckout.findById(pendingCheckoutId);
        if (!pending) {
            return NextResponse.json({ success: false, message: "Pending checkout not found" }, { status: 404 });
        }

        if (pending.user.toString() !== session.user.id) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        if (
            pending.status === "pending" &&
            pending.expiresAt &&
            pending.expiresAt < new Date()
        ) {
            await PendingCheckout.findByIdAndUpdate(pendingCheckoutId, { status: "expired" });
            return NextResponse.json(
                {
                    status: "expired",
                    qrUrl: pending.transferCode
                        ? buildVietQrUrl({
                              amount: pending.totalAmount,
                              description: pending.transferCode,
                          })
                        : pending.qrUrl,
                    transferCode: pending.transferCode,
                    amount: pending.totalAmount,
                    expiresAt: pending.expiresAt,
                },
                { status: 200 }
            );
        }

        const qrUrl = pending.transferCode
            ? buildVietQrUrl({
                  amount: pending.totalAmount,
                  description: pending.transferCode,
              })
            : pending.qrUrl;

        return NextResponse.json(
            {
                status: pending.status,
                orderId: pending.orderId?.toString() ?? null,
                qrUrl,
                transferCode: pending.transferCode,
                amount: pending.totalAmount,
                expiresAt: pending.expiresAt,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("PENDING PAYMENT STATUS ERROR:", error);
        return NextResponse.json({ success: false, message: "Failed to get payment status" }, { status: 500 });
    }
}
