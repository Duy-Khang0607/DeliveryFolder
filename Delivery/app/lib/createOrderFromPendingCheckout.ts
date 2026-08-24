import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Coupon from "@/app/models/coupon.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";
import PendingCheckout from "@/app/models/pendingCheckout.model";

type CreateOrderResult =
    | { success: true; order: typeof Orders.prototype; alreadyFulfilled: boolean }
    | { success: false; message: string; status: number };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findCompletedOrder(pendingCheckoutId: string): Promise<CreateOrderResult | null> {
    const completedPending = await PendingCheckout.findOne({
        _id: pendingCheckoutId,
        status: "completed",
    });

    if (!completedPending?.orderId) return null;

    const order = await Orders.findById(completedPending.orderId);
    if (!order) return null;

    return { success: true, order, alreadyFulfilled: true };
}

/** Chờ webhook / request khác hoàn tất khi status = processing */
async function waitForCompletedOrder(
    pendingCheckoutId: string,
    attempts = 12,
    delayMs = 500
): Promise<CreateOrderResult | null> {
    for (let i = 0; i < attempts; i++) {
        const resolved = await findCompletedOrder(pendingCheckoutId);
        if (resolved) return resolved;

        const current = await PendingCheckout.findById(pendingCheckoutId);
        if (!current || current.status === "expired") return null;
        if (current.status === "pending") return null;

        await sleep(delayMs);
    }

    return findCompletedOrder(pendingCheckoutId);
}

export async function createOrderFromPendingCheckout(
    pendingCheckoutId: string
): Promise<CreateOrderResult> {
    await connectDB();

    const alreadyCompleted = await findCompletedOrder(pendingCheckoutId);
    if (alreadyCompleted) return alreadyCompleted;

    const pending = await PendingCheckout.findOneAndUpdate(
        { _id: pendingCheckoutId, status: "pending" },
        { status: "processing" },
        { new: true }
    );

    if (!pending) {
        const waited = await waitForCompletedOrder(pendingCheckoutId);
        if (waited) return waited;

        const current = await PendingCheckout.findById(pendingCheckoutId);
        if (!current) {
            return { success: false, message: "Pending checkout not found", status: 404 };
        }
        if (current.status === "expired") {
            return { success: false, message: "Pending checkout expired", status: 410 };
        }
        return { success: false, message: "Order is being processed", status: 409 };
    }

    if (pending.idempotencyKey) {
        const existingOrder = await Orders.findOne({ idempotencyKey: pending.idempotencyKey });
        if (existingOrder) {
            await PendingCheckout.findByIdAndUpdate(pendingCheckoutId, {
                status: "completed",
                orderId: existingOrder._id,
            });
            return { success: true, order: existingOrder, alreadyFulfilled: true };
        }
    }

    const decremented: { id: string; qty: number }[] = [];

    try {
        for (const item of pending.items) {
            const qty = Number(item.quantity);
            if (!qty || qty <= 0) {
                return { success: false, message: "Invalid item quantity", status: 400 };
            }

            const updated = await Grocery.findOneAndUpdate(
                { _id: item.grocery, stock: { $gte: qty } },
                { $inc: { stock: -qty } }
            );

            if (!updated) {
                await Promise.all(
                    decremented.map((d) =>
                        Grocery.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })
                    )
                );
                await PendingCheckout.findByIdAndUpdate(pendingCheckoutId, { status: "expired" });
                return { success: false, message: "Out of stock after payment", status: 409 };
            }

            decremented.push({ id: item.grocery.toString(), qty });
        }

        const newOrder = await Orders.create({
            user: pending.user,
            items: pending.items,
            paymentMethod: "online",
            totalAmount: pending.totalAmount,
            address: pending.address,
            idempotencyKey: pending.idempotencyKey || null,
            couponCode: pending.couponCode || null,
            discountAmount: pending.discountAmount || 0,
            deliveryDistanceKm: pending.deliveryDistanceKm || 0,
            deliveryFee: pending.deliveryFee || 0,
            shipperEarning: pending.shipperEarning || 0,
            isPaid: true,
            stockDeducted: true,
            couponApplied: !!pending.couponCode,
        });

        if (pending.couponCode) {
            await Coupon.findOneAndUpdate(
                { code: pending.couponCode },
                { $inc: { usedCount: 1 }, $push: { usedBy: pending.user } }
            );
        }

        await PendingCheckout.findByIdAndUpdate(pendingCheckoutId, {
            status: "completed",
            orderId: newOrder._id,
        });

        await emitEventHandler("new-order", newOrder);
        await emitEventHandler("grocery-updated", {
            groceryIds: pending.items.map((i: { grocery: unknown }) => i.grocery),
        });

        return { success: true, order: newOrder, alreadyFulfilled: false };
    } catch (error) {
        await Promise.all(
            decremented.map((d) =>
                Grocery.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })
            )
        );
        await PendingCheckout.findByIdAndUpdate(pendingCheckoutId, { status: "pending" });
        throw error;
    }
}
