import jwt, { SignOptions } from "jsonwebtoken";
import { NotFoundError } from "./customError";

type Expiry =
    | number
    | `${number}${"ms" | "s" | "m" | "h" | "d" | "y"}`; // tipos válidos

const generateToken = (
    payload: object | string | Buffer,
    expiresIn: Expiry = "1h"
): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new NotFoundError("JWT_SECRET no está configurado");

    const options: SignOptions = { expiresIn };

    return jwt.sign(payload, secret, options);
};

export default generateToken;
