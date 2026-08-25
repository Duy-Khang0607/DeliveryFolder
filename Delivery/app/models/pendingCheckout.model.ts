import mongoose from "mongoose";

export interface IPendingCheckout {
    _id: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    items: {
        grocery: mongoose.Types.ObjectId;
        name: string;
        price: string;
        unit: string;
        image: string[];
        quantity: string;
    }[];
    paymentMethod: "online";
    totalAmount: number;
    address: {
        fullName: string;
        mobile: number;
        city: string;
        state: string;
        pincode: string;
        fullAddress: string;
        latitude: number;
        longitude: number;
    };
    couponCode?: string | null;
    discountAmount?: number;
    deliveryDistanceKm?: number;
    deliveryFee?: number;
    shipperEarning?: number;
    idempotencyKey?: string | null;
    stripeSessionId?: string | null;
    stripeSessionUrl?: string | null;
    transferCode?: string | null;
    qrUrl?: string | null;
    xgateTransactionId?: string | null;
    status: "pending" | "processing" | "completed" | "expired";
    orderId?: mongoose.Types.ObjectId | null;
    expiresAt?: Date | null;
}

const pendingCheckoutSchema = new mongoose.Schema<IPendingCheckout>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                grocery: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Grocery",
                    required: true,
                },
                name: String,
                price: String,
                unit: String,
                image: [String],
                quantity: Number,
            },
        ],
        paymentMethod: {
            type: String,
            enum: ["online"],
            default: "online",
        },
        totalAmount: Number,
        address: {
            fullName: String,
            mobile: Number,
            city: String,
            state: String,
            pincode: String,
            fullAddress: String,
            latitude: Number,
            longitude: Number,
        },
        couponCode: { type: String, default: null },
        discountAmount: { type: Number, default: 0 },
        deliveryDistanceKm: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        shipperEarning: { type: Number, default: 0 },
        idempotencyKey: {
            type: String,
            default: null,
            unique: true,
            sparse: true,
        },
        stripeSessionId: { type: String, default: null },
        stripeSessionUrl: { type: String, default: null },
        transferCode: { type: String, default: null, unique: true, sparse: true },
        qrUrl: { type: String, default: null },
        xgateTransactionId: { type: String, default: null },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "expired"],
            default: "pending",
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Orders",
            default: null,
        },
        expiresAt: { type: Date, default: null },
    },
    { timestamps: true }
);

pendingCheckoutSchema.index({ user: 1, status: 1, createdAt: -1 });

const PendingCheckout =
    mongoose.models.PendingCheckout ||
    mongoose.model("PendingCheckout", pendingCheckoutSchema);

export default PendingCheckout;
