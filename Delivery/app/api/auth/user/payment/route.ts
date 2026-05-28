import { auth } from "@/app/auth";
import connectDB from "@/app/lib/db";
import { emitEventHandler } from "@/app/lib/emitEventHandler";
import Orders from "@/app/models/orders.model";
import User from "@/app/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
    try {
        // connect DB
        await connectDB();

        const authSession = await auth()
        if (!authSession?.user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        }

        // get body
        const { userId, items, paymentMethod, totalAmount, address, idempotencyKey } = await req.json();

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

        // Lớp 1: Kiểm tra order đã tồn tại
        if (idempotencyKey) {
            const existingOrder = await Orders.findOne({ idempotencyKey });
            if (existingOrder?.stripeSessionUrl) {
                return NextResponse.json({ url: existingOrder.stripeSessionUrl }, { status: 200 });
            }
        }

        // Create order
        const newOrder = await Orders.create({
            user: userId,
            items,
            paymentMethod,
            totalAmount,
            address,
            idempotencyKey: idempotencyKey || null
        })

        // Stripe
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${process.env.NEXT_BASE_URL}/user/order-success`,
            cancel_url: `${process.env.NEXT_BASE_URL}/user/order-cancel`,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Delivery App Order Payment',
                        },
                        unit_amount: totalAmount * 100,
                    },
                    quantity: 1,
                },
            ],
            metadata: { orderId: newOrder._id.toString() },
        }, {
            idempotencyKey: idempotencyKey  // Stripe tự dedup nếu key trùng
        }
        );

        // Lưu stripeSessionUrl để idempotency: retry trả về URL cũ thay vì tạo session mới
        await Orders.findByIdAndUpdate(newOrder._id, { stripeSessionUrl: stripeSession.url });

        // Gọi event socket khi order thanh toán thành công
        // await emitEventHandler("new-order", newOrder)

        return NextResponse.json({ url: stripeSession?.url }, { status: 200 })

    } catch (error) {
        console.error("CREATE ORDER ERROR:", error);
        // Trả lỗi lỗi hệ thống
        return NextResponse.json({ success: false, message: 'Order Payment error' }, { status: 500 });
    }
}