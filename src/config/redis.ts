import { createClient } from 'redis';
import logger from '../utils/logger';
import config from './config';

// Configuracion de REDIS con variables de entorno

const client = createClient({
    username: config.REDIS_USERNAME || " ",
    password: config.REDIS_PASSWORD || " ",
    socket: {
        host: config.REDIS_HOST || " ",
        port: Number(config.REDIS_PORT) || 6379
    }
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis Client Connected'));

export const connectRedis = async () => {
    try {
        await client.connect();
    } catch (error: any) {
        logger.error('Failed to connect to Redis', error);
    }
};

export default client;
