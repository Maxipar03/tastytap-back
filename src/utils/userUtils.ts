import bcrypt from "bcrypt";

export const createHash = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

export const isValidPassword = async (passwordPlain: string, passwordHash: string): Promise<boolean> => {
    return await bcrypt.compare(passwordPlain, passwordHash);
};