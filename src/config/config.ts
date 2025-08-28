import "dotenv/config"

export default {
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/TastyTap",
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || "secret",
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ""
};