import compression from 'compression';
import { Request, Response } from 'express';

// Configuración de compresión optimizada
export const compressionConfig = compression({
    // Solo comprimir respuestas mayores a 1KB
    threshold: 1024,
    
    // Nivel de compresión (1-9, 6 es el balance óptimo)
    level: 6,
    
    // Filtro para determinar qué comprimir
    filter: (req: Request, res: Response) => {
        // No comprimir si el cliente no lo soporta
        if (req.headers['x-no-compression']) return false;
        
        // Comprimir solo tipos de contenido específicos
        const contentType = res.getHeader('content-type') as string;
        if (contentType) return /json|text|javascript|css|xml|svg|html/.test(contentType);
        
        
        // Por defecto, no comprimir
        return false;
    }
});