import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { calculateDeliveryPricing } from "@/app/lib/deliveryPricing";
import { buildPendingTransferCode } from "@/app/lib/xgate/buildTransferCode";
import { CHECKOUT_EXPIRES_MINUTES } from "@/app/lib/xgate/config";
import { buildVietQrUrl } from "@/app/lib/xgate/generateVietQR";
import Coupon from "@/app/models/coupon.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";
import PendingCheckout from "@/app/models/pendingCheckout.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const authSession = await auth();
        if (!authSession?.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const { userId, items, paymentMethod, address, idempotencyKey, couponCode } = await req.json();

        if (!userId || !Array.isArray(items) || items?.length === 0 || !paymentMethod || !address) {
            return NextResponse.json({ success: false, message: "Please send all creaditals" }, { status: 400 });
        }

        if (authSession.user.id !== userId) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        if (paymentMethod !== "online") {
            return NextResponse.json({ success: false, message: "Invalid payment method" }, { status: 400 });
        }

        if (!address.fullName || !address.mobile || !address.fullAddress) {
            return NextResponse.json(
                { success: false, message: "Address is missing required fields" },
                { status: 400 }
            );
        }

        const user = await User?.findById(userId);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        if (idempotencyKey) {
            const existingOrder = await Orders.findOne({ idempotencyKey, isPaid: true });
            if (existingOrder) {
                return NextResponse.json(
                    { success: true, alreadyPaid: true, orderId: existingOrder._id },
                    { status: 200 }
                );
            }

            const existingPending = await PendingCheckout.findOne({
                idempotencyKey,
                status: "pending",
            });
            if (existingPending?.qrUrl && existingPending._id) {
                return NextResponse.json(
                    {
                        pendingCheckoutId: existingPending._id.toString(),
                        qrUrl: existingPending.qrUrl,
                        transferCode: existingPending.transferCode,
                        amount: existingPending.totalAmount,
                        expiresAt: existingPending.expiresAt,
                    },
                    { status: 200 }
                );
            }

            const completedPending = await PendingCheckout.findOne({
                idempotencyKey,
                status: "completed",
            });
            if (completedPending?.orderId) {
                return NextResponse.json(
                    { success: true, alreadyPaid: true, orderId: completedPending.orderId },
                    { status: 200 }
                );
            }
        }

        for (const item of items) {
            const grocery = await Grocery.findById(item.grocery).select("stock name");
            if (!grocery || grocery.stock < Number(item.quantity)) {
                return NextResponse.json(
                    { success: false, message: `"${item.name}" is out of stock` },
                    { status: 409 }
                );
            }
        }

        if (!address.latitude || !address.longitude) {
            return NextResponse.json(
                { success: false, message: "Address coordinates are required" },
                { status: 400 }
            );
        }

        const subTotal = items.reduce(
            (sum: number, item: { price: string; quantity: string }) =>
                sum + Number(item.price) * Number(item.quantity),
            0
        );
        const pricing = calculateDeliveryPricing({
            subTotal,
            destLatitude: Number(address.latitude),
            destLongitude: Number(address.longitude),
        });

        let serverDiscountAmount = 0;
        let validCouponCode: string | null = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });

            const couponValid =
                coupon &&
                coupon.isActive &&
                (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
                (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
                !coupon.usedBy.some((id: { toString: () => string }) => id.toString() === userId) &&
                subTotal >= coupon.minOrderAmount;

            if (couponValid) {
                if (coupon.discountType === "percentage") {
                    serverDiscountAmount = (subTotal * coupon.discountValue) / 100;
                } else {
                    serverDiscountAmount = Math.min(coupon.discountValue, subTotal);
                }
                serverDiscountAmount = Math.round(serverDiscountAmount * 100) / 100;
                validCouponCode = coupon.code;
            }
        }

        const finalAmount = Math.max(subTotal + pricing.deliveryFee - serverDiscountAmount, 0);
        const expiresAt = new Date(Date.now() + CHECKOUT_EXPIRES_MINUTES * 60 * 1000);

        const pendingCheckout = await PendingCheckout.create({
            user: userId,
            items,
            paymentMethod: "online",
            totalAmount: finalAmount,
            address,
            idempotencyKey: idempotencyKey || null,
            couponCode: validCouponCode,
            discountAmount: serverDiscountAmount,
            deliveryDistanceKm: pricing.distanceKm,
            deliveryFee: pricing.deliveryFee,
            shipperEarning: pricing.shipperEarning,
            expiresAt,
        });

        const transferCode = buildPendingTransferCode(pendingCheckout._id.toString());
        const qrUrl = buildVietQrUrl({
            amount: finalAmount,
            description: transferCode,
        });

        await PendingCheckout.findByIdAndUpdate(pendingCheckout._id, {
            transferCode,
            qrUrl,
        });

        return NextResponse.json(
            {
                pendingCheckoutId: pendingCheckout._id.toString(),
                qrUrl,
                transferCode,
                amount: finalAmount,
                expiresAt,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("CREATE XGATE CHECKOUT ERROR:", error);
        return NextResponse.json({ success: false, message: "Order Payment error" }, { status: 500 });
    }
}
