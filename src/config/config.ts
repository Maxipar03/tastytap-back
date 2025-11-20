import "dotenv/config"

// Validar variables críticas
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'STRIPE_SECRET_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) throw new Error(`La siguiente variable de entorno no esta definida: ${envVar}`);
}

export default {
    MONGODB_URI: process.env.MONGODB_URI!,
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET!,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    FRONT_ENDPOINT: process.env.FRONT_ENDPOINT || "http://localhost:3000",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
}
