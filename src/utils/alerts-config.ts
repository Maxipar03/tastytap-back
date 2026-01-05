import { Sentry } from '../config/sentry.js';

// Configurar alertas para errores de base de datos
export const setupDatabaseAlerts = () => {
  const mongoose = require('mongoose');

  mongoose.connection.on('error', (error: Error) => {
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        component: 'database',
        type: 'connection_error',
        critical: true
      }
    });
  });

  mongoose.connection.on('disconnected', () => {
    Sentry.captureMessage('MongoDB reconnected', 'info');
  });

  mongoose.connection.on('reconnected', () => {
    Sentry.captureMessage('MongoDB reconnected', 'info');
  });
};

export const setupAllAlerts = () => {
  if (process.env.NODE_ENV === 'production') {
    setupDatabaseAlerts();
    Sentry.captureMessage('All monitoring alerts configured', 'info');
  }
};