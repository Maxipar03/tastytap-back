import cloudinary from "../config/cloudinary.js";

export const extractPublicIdFromUrl = (imageUrl: string): string | null => {
    if (!imageUrl) return null;
    
    const regex = /\/v\d+\/(.+)\./;
    const match = imageUrl.match(regex);
    return match?.[1] || null;
};

export const deleteImageFromCloudinary = async (imageUrl: string): Promise<void> => {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (publicId) {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Error eliminando imagen de Cloudinary:", error);
        }
    }
};