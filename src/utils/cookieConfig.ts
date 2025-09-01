import config from "../config/config.js";

export const getCookieConfig = (maxAge?: number) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
        httpOnly: true,
        secure: isProduction, 
        sameSite: isProduction ? 'none' as const : 'lax' as const, 
        maxAge: maxAge || 7 * 24 * 60 * 60 * 1000, 
        domain: isProduction ? undefined : undefined, 
        path: '/'
    };
};

export const getClearCookieConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' as const : 'lax' as const,
        path: '/'
    };
};