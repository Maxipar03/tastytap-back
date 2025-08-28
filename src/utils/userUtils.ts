import bcrypt from "bcrypt";

export const createHash = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

export const isValidPassword = (passwordPlain: string, passwordHash: string): boolean => {
    return bcrypt.compareSync(passwordPlain, passwordHash);
};