import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry.js';

/**
 * Middleware para capturar transacciones de performance en rutas críticas
 */
export const performanceMiddleware = (transactionName?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Sentry.withScope((scope) => {
      scope.setTag('route', req.route?.path || req.path);
      scope.setTag('method', req.method);
      scope.setContext('request', {
        url: req.originalUrl,
        method: req.method,
        'user.id': req.user?.id,
        'restaurant.id': req.user?.restaurant || req.tableData?.restaurant?.id
      });

      // Interceptar el final de la respuesta
      const originalSend = res.send;
      res.send = function(body) {
        scope.setTag('http.status_code', res.statusCode);
        
        if (res.statusCode >= 400) {
          scope.setTag('error', true);
        }
        
        return originalSend.call(this, body);
      };

      next();
    });
  };
};

/**
 * Middleware específico para rutas de órdenes
 */
export const orderPerformanceMiddleware = performanceMiddleware('order_operation');

/**
 * Middleware específico para rutas de pagos
 */
export const paymentPerformanceMiddleware = performanceMiddleware('payment_operation');

/**
 * Middleware específico para rutas de autenticación
 */
export const authPerformanceMiddleware = performanceMiddleware('auth_operation');