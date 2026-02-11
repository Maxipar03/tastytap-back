import { model, Schema } from "mongoose"
import { FoodDB } from "../../../types/food.js"
import mongoosePaginate from "mongoose-paginate-v2"

const FoodSchema = new Schema <FoodDB>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category',
        required: false,
        default: null
    },
    options: [{
        type: {
            type: String,
            enum: ['radio', 'checkbox'],
            required: true
        },
        required: {
            type: Boolean,
            default: false
        },
        name: {
            type: String,
            required: true
        },
        values: [{
            label: { type: String, required: true },
            price: { type: Number, default: 0, min: 0 }
        }]
    }],
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    ingredients: {
        type: [String],
        default: []
    },
    isVegetarian: {
        type: Boolean,
        default: false
    },
    isVegan: {
        type: Boolean,
        default: false
    },
    isGlutenFree: {
        type: Boolean,
        default: false
    },
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: 'restaurant',
        required: true
    },
    image: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

FoodSchema.plugin(mongoosePaginate);

export const FoodModel = model <FoodDB> ("food", FoodSchema)