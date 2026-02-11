import { model, Schema} from "mongoose"
import { UserDB } from "../../../types/user.js";

const UserSchema = new Schema <UserDB> ({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    isValidateMail: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: function() {
            return !this.isGoogle;
        }
    },
    isGoogle: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'waiter', 'chef', 'admin', 'owner'],
        default: 'user'
    },
    phone: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        default: ""
    },
    orders: [{
        type: Schema.Types.ObjectId,
        ref: "order"
    }],
    restaurant: {
        type: Schema.Types.ObjectId,
        ref: "restaurant"
    },
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

export const UserModel = model <UserDB> ("user", UserSchema);