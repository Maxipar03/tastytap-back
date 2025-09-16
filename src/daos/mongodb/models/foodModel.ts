import { model, Schema } from "mongoose"
import { FoodDB } from "../../../types/food.js"

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
        name: {
            type: String,
            required: true
        },
        values: [{
            label: { type: String, required: true },
            price: { type: Number, default: 0, min: 0 }
        }]
    }],
    available: {
        type: Boolean,
        default: true
    },
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
    spicyLevel: {
        type: Number,
        min: 0,
        max: 3,
        default: 0
    },
    image: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

export const FoodModel = model <FoodDB> ("food", FoodSchema)