import mongoose from "mongoose";
import { normalizeText } from "../lib/normalizeText";
import DeliveryAssignment from "./deliveryAssignment.model";
import { IUser } from "./user.model";

export interface IOrder {
    _id: mongoose.Types.ObjectId,
    user: mongoose.Types.ObjectId,
    items: [
        {
            grocery: mongoose.Types.ObjectId,
            name: string,
            price: string,
            unit: string,
            image: string[],
            quantity: string,
        }
    ]
    totalAmount: number,
    paymentMethod: 'cod' | 'online',
    address: {
        fullName: string,
        mobile: number,
        city: string,
        state: string,
        pincode: string,
        fullAddress: string,
        latitude: number,
        longitude: number
    },
    status: 'Pending' | 'Out of delivery' | 'Delivered' | 'Cancelled',
    createdAt?: Date,
    updatedAt?: Date,
    isPaid: Boolean,
    assignedDeliveryBoy?: IUser | null,
    assignment?: typeof DeliveryAssignment | null
    deliveryOTP?: string | null,
    deliveryOTPVerification: boolean,
    deliveredAt?: Date | null,
    otpSentAt?: Date | null,
    idempotencyKey?: string | null,
    stripeSessionUrl?: string | null
    searchText: string
}

const orderSchema = new mongoose.Schema<IOrder>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            grocery: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Grocery',
                required: true
            },
            name: String,
            price: String,
            unit: String,
            image: [String],
            quantity: Number
        }
    ],
    paymentMethod: {
        type: String,
        enum: ['cod', 'online'],
        default: 'cod'
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
        longitude: Number
    },
    status: {
        type: String,
        enum: ['Pending', 'Out of delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DeliveryAssignment",
        default: null
    },
    assignedDeliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryOTP: {
        type: String,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    otpSentAt: {
        type: Date,
        default: null
    },
    deliveryOTPVerification: {
        type: Boolean,
        default: false
    },
    idempotencyKey: {
        type: String,
        default: null,
        unique: true,
        sparse: true
    },
    stripeSessionUrl: {
        type: String,
        default: null
    },
    searchText: {
        type: String,
        default: '',
    }
}, { timestamps: true });

// Indexes for common query patterns
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ searchText: 1 })

// Hook tự build searchText khi save
orderSchema.pre('save', async function () {
    const o = this as any
    const parts = [
        o.address?.fullName,
        o.address?.fullAddress,
        o.address?.city,
        o.address?.state,
        o.address?.pincode,
        o.address?.mobile?.toString(),
        o?._id?.toString(),
        o?.items?.map((i: any) => i.grocery?.name) ?? [],
        o?.items?.map((i: any) => i.grocery?.brand) ?? [],
        o?.items?.map((i: any) => i.grocery?.price) ?? [],
        o?.items?.map((i: any) => i.grocery?.unit) ?? [],
        o?.items?.map((i: any) => i.grocery?.quantity) ?? [],
        o?.totalAmount?.toString(),
        o.paymentMethod,
        o?.status,
        o?.assignedDeliveryBoy?.toString(),
        o?.assignment?.toString(),
        o?.deliveryOTP,
        o?.deliveryOTPVerification,
        o?.deliveredAt,
        o?.otpSentAt,
        o?.idempotencyKey,
        o?.stripeSessionUrl,
        o?.createdAt?.toString(),
        o?.updatedAt?.toString(),
        ...(o.items?.map((i: any) => i.name) ?? []),
    ].filter(Boolean).join(' ')
    o.searchText = normalizeText(parts)
})

const Orders = mongoose.models.Orders || mongoose.model("Orders", orderSchema);

export default Orders;