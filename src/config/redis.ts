import { createClient } from 'redis';
import logger from '../utils/logger';

const client = createClient({
    username: process.env.REDIS_USERNAME || " ",
    password: process.env.REDIS_PASSWORD || " ",
    socket: {
        host: process.env.REDIS_HOST || " ",
        port: Number(process.env.REDIS_PORT) || 6379
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
