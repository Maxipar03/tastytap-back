import logger from './logger.js';

export const setupProcessLogging = () => {
    // Capturar errores no manejados
    process.on('uncaughtException', (error: Error) => {
        logger.fatal({
            error: error.message,
            stack: error.stack,
            type: 'uncaughtException'
        }, 'Error no capturado - cerrando aplicación');
        
        process.exit(1);
    });

    // Capturar promesas rechazadas no manejadas
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        logger.fatal({
            reason: reason?.message || reason,
            stack: reason?.stack,
            type: 'unhandledRejection'
        }, 'Promesa rechazada no manejada');
        
        process.exit(1);
    });

    // Log de señales del sistema
    process.on('SIGTERM', () => {
        logger.info('Señal SIGTERM recibida - cerrando aplicación gracefully');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        logger.info('Señal SIGINT recibida - cerrando aplicación gracefully');
        process.exit(0);
    });

    // Log de inicio de aplicación
    logger.info({
        NodeVersion: process.version,
        Platform: process.platform,
        Arch: process.arch,
        PID: process.pid,
        Environment: process.env.NODE_ENV || 'development'
    }, 'Aplicación iniciada');
};