import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config/config";

type Expiry =
    | number
    | `${number}${"ms" | "s" | "m" | "h" | "d" | "y"}`; // tipos válidos

const generateToken = (
    payload: object | string | Buffer,
    expiresIn: Expiry = "1h"
): string => {

    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, config.JWT_SECRET, options);
};

export default generateToken;
