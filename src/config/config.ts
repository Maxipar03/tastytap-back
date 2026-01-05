import "dotenv/config"

// Validar variables críticas
const requiredEnvVars = [
    'MONGODB_URI',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'JWT_SECRET',
    'PORT',
    'SENTRY_DSN',
    'SESSION_SECRET',
    'FRONT_ENDPOINT',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_USERNAME',
    'REDIS_PASSWORD',
    'REDIS_HOST',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) throw new Error(`La siguiente variable de entorno no esta definida: ${envVar}`);
}

export default {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI!,
    REDIS_USERNAME: process.env.REDIS_USERNAME!,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD!,
    REDIS_HOST: process.env.REDIS_HOST!,
    SENTRY_DSN: process.env.SENTRY_DSN!,
    REDIS_PORT: process.env.REDIS_PORT!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    JWT_SECRET: process.env.JWT_SECRET!,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    FRONT_ENDPOINT: process.env.FRONT_ENDPOINT!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
}
