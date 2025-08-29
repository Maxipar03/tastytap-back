import jwt from "jsonwebtoken";
import { NotFoundError } from "./customError";

const generateToken = (payload: object | string | Buffer): string => {
    const secret = process.env.JWT_SECRET;
    if(!secret) throw new NotFoundError("JWT_SECRET no está configurado")
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
    });
};

export default generateToken;