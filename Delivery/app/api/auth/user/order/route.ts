import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Coupon from "@/app/models/coupon.model";
import Grocery from "@/app/models/grocery.model";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { calculateDeliveryPricing } from "@/app/lib/deliveryPricing";



export async function POST(req: NextRequest) {
    try {
        // connect DB
        await connectDB();

        const session = await auth()
        
        if (!session?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // get body
        const { userId, items, paymentMethod, totalAmount, address, idempotencyKey, couponCode } = await req.json();

        // Check req
        if (!userId || !Array.isArray(items) || items?.length === 0 || !paymentMethod || totalAmount == null || !address) {
            return NextResponse.json({ success: false, message: 'Please send all creaditals' }, { status: 400 });
        }

        if (!address.fullName || !address.mobile || !address.fullAddress) {
            return NextResponse.json(
                { success: false, message: "Address is missing required fields" },
                { status: 400 }
            );
        }

        // find user
        const user = await User?.findById(userId);

        // Trả lỗi nếu userr không tồn taj
        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        // Kiểm tra đơn hàng đã tồn tại chưa
        if (idempotencyKey) {
            const existingOrder = await Orders.findOne({ idempotencyKey });
            if (existingOrder) {
                return NextResponse.json({ success: true, message: 'Order already created', newOrder: existingOrder }, { status: 200 });
            }
        }

        // Xử lý stock
        const decremented: { id: string, qty: number }[] = []
        for (const item of items) {
            const updated = await Grocery.findOneAndUpdate(
              { _id: item.grocery, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity } }
            )
            if (!updated) {
              // rollback tất cả item đã trừ trước đó
              await Promise.all(decremented.map(d =>
                Grocery.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })
              ))
              return NextResponse.json({ success: false, message: `"${item.name}" is out of stock` }, { status: 409 })
            }
            decremented.push({ id: item.grocery, qty: item.quantity })
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

        // Create order
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
            stockDeducted: true,
            couponApplied: !!validCouponCode,
        })

        // Cập nhật coupon usage sau khi tạo order thành công
        if (validCouponCode) {
            await Coupon.findOneAndUpdate(
                { code: validCouponCode },
                { $inc: { usedCount: 1 }, $push: { usedBy: userId } }
            );
        }

        // Gọi event socket khi order thanh toán thành công
        await emitEventHandler("new-order", newOrder)

        // Gọi event socket cập nhật stock
        await emitEventHandler("grocery-updated", { groceryIds: items.map(i => i.grocery) })

        // Trả order thành công
        return NextResponse.json({ success: true, message: 'Create new order successfully', newOrder }, { status: 201 });

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        // Trả lỗi lỗi hệ thống
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}