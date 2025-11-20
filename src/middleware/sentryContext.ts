import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry.js';

/**
 * Middleware simplificado - Sentry.setupExpressErrorHandler captura request/response automáticamente
 */
export const sentryContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id?.toString(),
      email: req.user.email,
      username: req.user.name
    });
  }
  next();
};