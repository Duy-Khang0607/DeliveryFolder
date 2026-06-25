import mongoose from "mongoose";

export interface IUnits {
    _id: mongoose.Types.ObjectId
    name: string,  // "Kilogram (kg)"
    isActive: boolean   // ẩn/hiện unit
    order: number       // thứ tự hiển thị
    createdAt: Date
}

const unitsSchema = new mongoose.Schema<IUnits>({
    name: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    order: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

unitsSchema.index({ name: 1, isActive: 1, order: 1 });

const Units = mongoose.models.Units || mongoose.model("Units", unitsSchema);

export default Units;