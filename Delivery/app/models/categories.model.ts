import mongoose from "mongoose";

export interface ICategories {
    _id: mongoose.Types.ObjectId
    name: string        // "Fresh Food"
    isActive: boolean   // ẩn/hiện category
    order: number       // thứ tự hiển thị
    createdAt: Date
}

const categoriesSchema = new mongoose.Schema<ICategories>({
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

categoriesSchema.index({ name: 1, isActive: 1, order: 1 });

const Categories = mongoose.models.Categories || mongoose.model("Categories", categoriesSchema);

export default Categories;