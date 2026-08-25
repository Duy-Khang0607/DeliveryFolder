import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Orders from "@/app/models/orders.model";

type FulfillExistingResult =
    | { success: true; order: typeof Orders.prototype; alreadyFulfilled: boolean }
    | { success: false; message: string; status: number };

const emitOrderPaymentUpdated = async (order: typeof Orders.prototype) => {
    await emitEventHandler("order-payment-updated", {
        orderId: order._id.toString(),
        paymentMethod: order.paymentMethod,
        isPaid: Boolean(order.isPaid),
        status: order.status,
    });
};

/** Xác nhận thanh toán online cho đơn COD đã tồn tại (đổi method COD → Online) */
export async function fulfillExistingOrderPayment(
    orderId: string
): Promise<FulfillExistingResult> {
    await connectDB();

    const order = await Orders.findById(orderId);
    if (!order) {
        return { success: false, message: "Order not found", status: 404 };
    }

    if (order.status !== "Pending") {
        return { success: false, message: "Order is not pending", status: 400 };
    }

    const paid = Boolean(order.isPaid);

    if (order.paymentMethod === "online" && paid) {
        await emitOrderPaymentUpdated(order);
        return { success: true, order, alreadyFulfilled: true };
    }

    if (order.paymentMethod === "cod" && paid) {
        const updated = await Orders.findByIdAndUpdate(
            orderId,
            { paymentMethod: "online", stripeSessionUrl: null, paymentQrUrl: null, transferCode: null },
            { new: true }
        );
        const finalOrder = updated || order;
        await emitOrderPaymentUpdated(finalOrder);
        return { success: true, order: finalOrder, alreadyFulfilled: true };
    }

    if (order.paymentMethod !== "cod" || paid) {
        return { success: false, message: "Order cannot be switched to online payment", status: 400 };
    }

    const updated = await Orders.findByIdAndUpdate(
        orderId,
        {
            paymentMethod: "online",
            isPaid: true,
            stripeSessionUrl: null,
            paymentQrUrl: null,
            transferCode: null,
        },
        { new: true }
    );

    if (!updated) {
        return { success: false, message: "Failed to update order payment", status: 500 };
    }

    await emitOrderPaymentUpdated(updated);

    return { success: true, order: updated, alreadyFulfilled: false };
}
