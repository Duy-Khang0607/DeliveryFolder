import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import Coupon from "@/app/models/coupon.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { calculateDeliveryPricing } from "@/app/lib/deliveryPricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const authSession = await auth()
        if (!authSession?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        const { userId, items, paymentMethod, address, idempotencyKey, couponCode } = await req.json();

        if (!userId || !Array.isArray(items) || items?.length === 0 || !paymentMethod || !address) {
            return NextResponse.json({ success: false, message: 'Please send all creaditals' }, { status: 400 });
        }

        if (!address.fullName || !address.mobile || !address.fullAddress) {
            return NextResponse.json(
                { success: false, message: "Address is missing required fields" },
                { status: 400 }
            );
        }

        const user = await User?.findById(userId);

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        if (idempotencyKey) {
            const existingOrder = await Orders.findOne({ idempotencyKey });
            if (existingOrder?.stripeSessionUrl) {
                return NextResponse.json({ url: existingOrder.stripeSessionUrl }, { status: 200 });
            }
        }

        // Kiểm tra stock (chưa trừ — trừ khi Stripe webhook xác nhận thanh toán)
        for (const item of items) {
            const grocery = await Grocery.findById(item.grocery).select('stock name');
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

        const subTotal = items.reduce((sum: number, item: any) => sum + Number(item.price) * Number(item.quantity), 0);
        const pricing = calculateDeliveryPricing({
            subTotal,
            destLatitude: Number(address.latitude),
            destLongitude: Number(address.longitude),
        });

        // Re-validate coupon server-side
        let serverDiscountAmount = 0;
        let validCouponCode: string | null = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });

            const couponValid =
                coupon &&
                coupon.isActive &&
                (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
                (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) &&
                !coupon.usedBy.some((id: any) => id.toString() === userId) &&
                subTotal >= coupon.minOrderAmount;

            if (couponValid) {
                if (coupon.discountType === 'percentage') {
                    serverDiscountAmount = (subTotal * coupon.discountValue) / 100;
                } else {
                    serverDiscountAmount = Math.min(coupon.discountValue, subTotal);
                }
                serverDiscountAmount = Math.round(serverDiscountAmount * 100) / 100;
                validCouponCode = coupon.code;
            }
        }

        const finalAmount = Math.max(subTotal + pricing.deliveryFee - serverDiscountAmount, 0);

        const newOrder = await Orders.create({
            user: userId,
            items,
            paymentMethod,
            totalAmount: finalAmount,
            address,
            idempotencyKey: idempotencyKey || null,
            couponCode: validCouponCode,
            discountAmount: serverDiscountAmount,
            deliveryDistanceKm: pricing.distanceKm,
            deliveryFee: pricing.deliveryFee,
            shipperEarning: pricing.shipperEarning,
        })

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${process.env.NEXT_BASE_URL}/user/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_BASE_URL}/user/checkout`,
            line_items: [
                {
                    price_data: {
                        currency: 'vnd',
                        product_data: {
                            name: 'Delivery App Order Payment',
                        },
                        unit_amount: Math.round(finalAmount),
                    },
                    quantity: 1,
                },
            ],
            metadata: { orderId: newOrder._id.toString() },
        }, {
            idempotencyKey: idempotencyKey
        });

        await Orders.findByIdAndUpdate(newOrder._id, { stripeSessionUrl: stripeSession.url });

        return NextResponse.json({ url: stripeSession?.url }, { status: 200 })

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        return NextResponse.json({ success: false, message: 'Order Payment error' }, { status: 500 });
    }
}
