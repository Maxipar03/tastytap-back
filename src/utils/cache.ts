import client from '../config/redis';
import logger from './logger';

export class CacheService {
    private defaultTTL = 3600; // 1 hora

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error: any) {
            logger.error(`Cache get error for key ${key}`, error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
        try {
            await client.setEx(key, ttl, JSON.stringify(value));
        } catch (error: any) {
            logger.error(`Cache set error for key ${key}`, error);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await client.del(key);
        } catch (error: any) {
            logger.error(`Cache delete error for key ${key}`, error);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await client.keys(pattern);
            if (keys.length > 0) await client.del(keys);
        } catch (error: any) {
            logger.error(`Cache delete pattern error for ${pattern}`, error);
        }
    }
}

export default new CacheService();
