import mongoose from "mongoose";

export interface IDeliveryAssignment {
    _id: mongoose.Types.ObjectId,
    order: mongoose.Types.ObjectId,
    brodcastedTo: mongoose.Types.ObjectId[],
    rejectedBy: mongoose.Types.ObjectId[],
    assignedTo: mongoose.Types.ObjectId | null,
    status: 'pending' | 'brodcasted' | 'assigned' | 'completed' | 'rejected',
    accpectedAt: Date,
    createdAt?: Date,
    updatedAt?: Date,
}

const deliverySchema = new mongoose.Schema<IDeliveryAssignment>({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Orders"
    },
    brodcastedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    rejectedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['pending', 'brodcasted', 'assigned', 'completed', 'rejected'],
        default: 'brodcasted'
    },
    accpectedAt: {
        type: Date
    },
    createdAt: {
        type: Date
    },
    updatedAt: {
        type: Date
    }
}, { timestamps: true });

// Indexes for common query patterns
deliverySchema.index({ assignedTo: 1, status: 1 });
deliverySchema.index({ order: 1 });
deliverySchema.index({ brodcastedTo: 1, status: 1 });

const DeliveryAssignment = mongoose.models.DeliveryAssignment || mongoose.model("DeliveryAssignment", deliverySchema);

export default DeliveryAssignment;