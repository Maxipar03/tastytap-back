import { v2 as cloudinary } from "cloudinary";
import config from "./config";

const validateConfig = () => {
    const required: (keyof typeof config)[] = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    for (const key of required) {
        if (!config[key]) {
            throw new Error(`${key} no está configurado`);
        }
    }
};

validateConfig();
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET
})



export default cloudinary;