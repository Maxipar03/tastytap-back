import jwt from "jsonwebtoken";

const generateToken = (payload: object | string | Buffer): string => {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
        expiresIn: "1h",
    });
};

export default generateToken;