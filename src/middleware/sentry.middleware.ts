import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry.config.js';

/**
 * Middleware Unificado de Sentry
 * Captura contexto de usuario, etiquetas de performance y metadatos de la solicitud.
 */
export const enrichSentryContext = (operationName?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { user, method, path, route } = req;

    if (user) {
      Sentry.setUser({
        id: String(user.id),
        email: user.email,
        username: user.name,
      });

      Sentry.setTag("restaurant_id", user.restaurant?.id ? String(user.restaurant.id) : undefined);
      Sentry.setTag("user_role", user.role);
    }

    // Metadatos de la operación
    if (operationName) Sentry.setTag("operation_type", operationName);
    Sentry.setTag("http.method", method);
    Sentry.setTag("http.path", route?.path || path);

    const scope = Sentry.getCurrentScope();
    if (operationName) scope.setTag("operation_type", operationName);

    res.on('finish', () => {
      if (res.statusCode >= 500) {
        scope.setLevel("error");
      } else if (res.statusCode >= 400) {
        scope.setLevel("warning");
      }
    });

    next();
  };
};

export const monitorPaymentSentry = enrichSentryContext('payment_operation');
export const monitorAuthSentry = enrichSentryContext('auth_operation');
export const monitorOrderSentry = enrichSentryContext('order_operation');
export const traceRequestSentry = enrichSentryContext();