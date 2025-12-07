import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

// Rate limiter general (100 requests por minuto por IP)
const rateLimiter = new RateLimiterMemory({
    points: 100, // Número de requests
    duration: 60, // Por minuto
});

// Rate limiter estricto para autenticación (5 intentos por minuto)
const authRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
});

// Rate limiter para API críticas (40 requests por minuto)
const apiRateLimiter = new RateLimiterMemory({
    points: 40,
    duration: 60,
});

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    rateLimiter.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch((rejRes) => {
            logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
            res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Try again later.',
                retryAfter: Math.round(rejRes.msBeforeNext / 1000)
            });
        });
};

export const authRateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    authRateLimiter.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch((rejRes) => {
            logger.warn({ ip: req.ip, path: req.path }, 'Auth rate limit exceeded');
            res.status(429).json({
                error: 'Too Many Authentication Attempts',
                message: 'Too many login attempts. Try again later.',
                retryAfter: Math.round(rejRes.msBeforeNext / 1000)
            });
        });
};

export const apiRateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    apiRateLimiter.consume(req.ip || 'unknown')
        .then(() => {
            next();
        })
        .catch((rejRes) => {
            logger.warn({ ip: req.ip, path: req.path }, 'API rate limit exceeded');
            res.status(429).json({
                error: 'API Rate Limit Exceeded',
                message: 'Too many API requests. Try again later.',
                retryAfter: Math.round(rejRes.msBeforeNext / 1000)
            });
        });
};