import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN no configurado - Sentry deshabilitado');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [nodeProfilingIntegration()],
    release: process.env.npm_package_version || '1.0.0',
    
    beforeSend(event) {
      const errorMsg = event.exception?.values?.[0]?.value || '';
      if (errorMsg.includes('Not allowed by CORS') || errorMsg.includes('Too Many Requests')) {
        return null;
      }
      return event;
    }
  });

  Sentry.getCurrentScope().setTag('service', 'tastytap-backend');
};

export { Sentry };