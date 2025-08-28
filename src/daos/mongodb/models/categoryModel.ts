import { model, Schema } from "mongoose"
import { CategoryDB } from "../../../types/category.js";

const CategorySchema = new Schema <CategoryDB> ({
    name: {
        type: String,
        required: true,
        trim: true
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "restaurant",
        required: true
    }
}, {
    timestamps: true
});

export const CategoryModel = model <CategoryDB> ("category", CategorySchema);