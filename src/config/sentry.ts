import * as Sentry from "@sentry/node";
import config from "./config";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Configuracion de Sentry con variables de entorno

export const initSentry = () => {

  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [nodeProfilingIntegration()],
    release: '1.0.0',
    
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