import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Coupon from "@/app/models/coupon.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";

type FulfillResult =
    | { success: true; order: typeof Orders.prototype; alreadyFulfilled: boolean }
    | { success: false; message: string; status: number }

export async function fulfillOnlineOrder(orderId: string): Promise<FulfillResult> {
    await connectDB();

    const order = await Orders.findById(orderId);
    if (!order) {
        return { success: false, message: "Order not found", status: 404 };
    }

    // Đã hoàn tất đầy đủ (trừ stock + mark paid)
    if (order.stockDeducted && order.isPaid) {
        return { success: true, order, alreadyFulfilled: true };
    }

    const decremented: { id: string; qty: number }[] = [];
    let stockWasDeducted = false;

    // Trừ stock nếu chưa trừ — kể cả isPaid=true từ webhook cũ
    if (!order.stockDeducted) {
        for (const item of order.items) {
            const qty = Number(item.quantity);
            if (!qty || qty <= 0) {
                return { success: false, message: "Invalid item quantity", status: 400 };
            }

            const updated = await Grocery.findOneAndUpdate(
                { _id: item.grocery, stock: { $gte: qty } },
                { $inc: { stock: -qty } }
            );

            if (!updated) {
                await Promise.all(decremented.map(d =>
                    Grocery.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })
                ));
                await Orders.findByIdAndUpdate(orderId, { status: "Cancelled" });
                return { success: false, message: "Out of stock after payment", status: 409 };
            }

            decremented.push({ id: item.grocery.toString(), qty });
        }
        stockWasDeducted = true;
    }

    const updated = await Orders.findByIdAndUpdate(
        orderId,
        { isPaid: true, stockDeducted: true },
        { new: true }
    );

    if (!updated) {
        if (stockWasDeducted) {
            await Promise.all(decremented.map(d =>
                Grocery.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })
            ));
        }
        return { success: false, message: "Failed to update order", status: 500 };
    }

    // Áp coupon nếu chưa apply (tránh double-count khi webhook retry)
    if (updated.couponCode && !updated.couponApplied) {
        await Coupon.findOneAndUpdate(
            { code: updated.couponCode },
            { $inc: { usedCount: 1 }, $push: { usedBy: updated.user } }
        );
        await Orders.findByIdAndUpdate(orderId, { couponApplied: true });
    }

    if (stockWasDeducted || !order.isPaid) {
        await emitEventHandler("new-order", updated);
    }

    if (stockWasDeducted) {
        await emitEventHandler("grocery-updated", {
            groceryIds: order.items.map((i: { grocery: unknown }) => i.grocery),
        });
    }

    return { success: true, order: updated, alreadyFulfilled: false };
}
