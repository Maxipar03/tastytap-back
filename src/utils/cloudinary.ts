import cloudinary from "../config/cloudinary.js";
import { BadRequestError } from "./custom-error.js";


// Extrae el publicId de Cloudinary a partir de una URL almacenada en la base de datos
export const extractPublicIdFromUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    
    const regex = /\/v\d+\/(.+)\./;
    const match = imageUrl.match(regex);
    return match?.[1] || null;
};

// Elimina una imagen de Cloudinary usando la URL almacenada.
export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw new Error("Error eliminando imagen");
        }
    }
};

// Sube una imagen a Cloudinary utilizando el buffer de Multer.
export const uploadToCloudinary = async (file: Express.Multer.File): Promise<string> => {
        
        if (!file) throw new BadRequestError("No se selecciono una imagen para la comida");

        try {

            const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            const result = await cloudinary.uploader.upload(base64File, {
                folder: "foods"
            });

            return result.secure_url;

        } catch (error) {
            console.error("Cloudinary upload error:", error);
            throw new Error("Error subiendo imagen");
        }
    }
