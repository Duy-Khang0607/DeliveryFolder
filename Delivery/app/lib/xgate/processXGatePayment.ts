import { createOrderFromPendingCheckout } from "@/app/lib/createOrderFromPendingCheckout";
import { fulfillExistingOrderPayment } from "@/app/lib/fulfillExistingOrderPayment";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import connectDB from "@/app/lib/db";
import Orders from "@/app/models/orders.model";
import PendingCheckout from "@/app/models/pendingCheckout.model";
import {
    buildOrderTransferCode,
    buildPendingTransferCode,
    extractTransferCode,
} from "./buildTransferCode";

export type XGateWebhookPayload = {
    id: string;
    content: string;
    transferType: string;
    transferAmount?: number;
    amount?: number;
    referenceCode?: string;
};

export type ProcessXGateResult =
    | {
          handled: true;
          type: "pending" | "order";
          alreadyFulfilled: boolean;
          orderId?: string;
          userId?: string;
      }
    | { handled: false; reason: string };

const parseTransferAmount = (payload: XGateWebhookPayload): number =>
    Math.round(Number(payload.transferAmount ?? payload.amount ?? 0));

const emitPaymentConfirmed = async (payload: {
    userId: string;
    type: "pending" | "order";
    orderId: string;
    pendingCheckoutId?: string;
}) => {
    await emitEventHandler("xgate-payment-confirmed", payload);
};

export const processXGatePayment = async (
    payload: XGateWebhookPayload
): Promise<ProcessXGateResult> => {
    if (payload.transferType !== "in") {
        return { handled: false, reason: "Ignored non-incoming transfer" };
    }

    const transferCode = extractTransferCode(payload.content);
    if (!transferCode) {
        return { handled: false, reason: "Transfer code not found in content" };
    }

    const amount = parseTransferAmount(payload);
    if (!amount || amount <= 0) {
        return { handled: false, reason: "Invalid transfer amount" };
    }

    await connectDB();

    if (transferCode.startsWith("DH")) {
        const pending = await PendingCheckout.findOne({
            transferCode,
            status: { $in: ["pending", "processing", "completed"] },
        });

        if (!pending) {
            return { handled: false, reason: `Pending checkout not found for ${transferCode}` };
        }

        if (pending.status === "completed" && pending.orderId) {
            await emitPaymentConfirmed({
                userId: pending.user.toString(),
                type: "pending",
                orderId: pending.orderId.toString(),
                pendingCheckoutId: pending._id.toString(),
            });
            return {
                handled: true,
                type: "pending",
                alreadyFulfilled: true,
                orderId: pending.orderId.toString(),
                userId: pending.user.toString(),
            };
        }

        const expectedAmount = Math.round(pending.totalAmount);
        if (expectedAmount !== amount) {
            console.warn(
                `[xGate] Amount mismatch: expected ${expectedAmount}, got ${amount} for ${transferCode}`
            );
            return {
                handled: false,
                reason: `Amount mismatch: expected ${expectedAmount}, got ${amount}`,
            };
        }

        if (pending.expiresAt && pending.expiresAt < new Date()) {
            await PendingCheckout.findByIdAndUpdate(pending._id, { status: "expired" });
            return { handled: false, reason: "Pending checkout expired" };
        }

        const result = await createOrderFromPendingCheckout(pending._id.toString());

        if (!result.success) {
            return { handled: false, reason: result.message };
        }

        await PendingCheckout.findByIdAndUpdate(pending._id, {
            xgateTransactionId: payload.id,
        });

        const orderId = result.order._id.toString();
        const userId = pending.user.toString();

        await emitPaymentConfirmed({
            userId,
            type: "pending",
            orderId,
            pendingCheckoutId: pending._id.toString(),
        });

        return {
            handled: true,
            type: "pending",
            alreadyFulfilled: result.alreadyFulfilled,
            orderId,
            userId,
        };
    }

    if (transferCode.startsWith("CO")) {
        const order = await Orders.findOne({
            transferCode,
            status: "Pending",
            paymentMethod: "cod",
            isPaid: false,
        });

        if (!order) {
            const paidOrder = await Orders.findOne({ transferCode, isPaid: true });
            if (paidOrder) {
                await emitPaymentConfirmed({
                    userId: paidOrder.user.toString(),
                    type: "order",
                    orderId: paidOrder._id.toString(),
                });
                return {
                    handled: true,
                    type: "order",
                    alreadyFulfilled: true,
                    orderId: paidOrder._id.toString(),
                    userId: paidOrder.user.toString(),
                };
            }
            return { handled: false, reason: `Order not found for ${transferCode}` };
        }

        const expectedAmount = Math.round(order.totalAmount);
        if (expectedAmount !== amount) {
            console.warn(
                `[xGate] Amount mismatch: expected ${expectedAmount}, got ${amount} for ${transferCode}`
            );
            return {
                handled: false,
                reason: `Amount mismatch: expected ${expectedAmount}, got ${amount}`,
            };
        }

        const result = await fulfillExistingOrderPayment(order._id.toString());

        if (!result.success) {
            return { handled: false, reason: result.message };
        }

        await Orders.findByIdAndUpdate(order._id, {
            xgateTransactionId: payload.id,
        });

        const orderId = result.order._id.toString();
        const userId = order.user.toString();

        await emitPaymentConfirmed({
            userId,
            type: "order",
            orderId,
        });

        return {
            handled: true,
            type: "order",
            alreadyFulfilled: result.alreadyFulfilled,
            orderId,
            userId,
        };
    }

    return { handled: false, reason: "Unknown transfer code prefix" };
};

export const resolveTransferCodeFromId = (
    type: "pending" | "order",
    id: string
): string => (type === "pending" ? buildPendingTransferCode(id) : buildOrderTransferCode(id));
