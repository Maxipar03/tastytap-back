import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.config.js';

/**
 * Configuraciones de Rate Limit
 */
const limiters = {
    standard: new RateLimiterMemory({ points: 100, duration: 60 }),
    strict: new RateLimiterMemory({ points: 5, duration: 60 }),
    sensitive: new RateLimiterMemory({ points: 40, duration: 60 }),
};

/**
 * Factory para crear middlewares de rate limit.
 */
const createRateLimitMiddleware = (limiter: RateLimiterMemory, label: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const key = req.ip || 'unknown';
            await limiter.consume(key);
            next();
        } catch (rejRes: any) {
            const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 1;
            
            logger.warn(
                { ip: req.ip, path: req.path, type: label, retryAfter }, 
                `Rate limit exceeded: ${label}`
            );

            res.set('Retry-After', String(retryAfter));

            res.status(429).json({
                status: 429,
                error: 'Too Many Requests',
                message: `Límite de peticiones excedido (${label}). Reintenta en ${retryAfter} segundos.`,
                retryAfter
            });
        }
    };
};

// 100 req/min - Uso general
export const rateLimitStandard = createRateLimitMiddleware(limiters.standard, 'STANDARD');

// 5 req/min - Auth, Login, Registro
export const rateLimitStrict = createRateLimitMiddleware(limiters.strict, 'STRICT');

// 40 req/min - Endpoints sensibles o pesados
export const rateLimitSensitive = createRateLimitMiddleware(limiters.sensitive, 'SENSITIVE');