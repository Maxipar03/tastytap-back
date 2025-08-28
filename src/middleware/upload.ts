import fs from "fs";
import path from "path";
import multer, { StorageEngine } from "multer";
import { Request } from 'express';

const storage: StorageEngine = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        const dir = path.join("src", "public", "foods");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});

// Filtro opcional para restringir tipos de archivo
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isValid = allowedTypes.test(file.mimetype);
    if (isValid) {
        cb(null, true);
    } else {
        cb(new Error("Formato de imagen no válido. Solo jpg, jpeg, png y gif."));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});