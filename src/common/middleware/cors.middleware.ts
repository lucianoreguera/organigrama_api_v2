import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de CORS personalizado para asegurar que se permitan
 * todos los headers necesarios, especialmente x-api-key
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Obtener el origen de la petición
  const origin = req.headers.origin;

  // Permitir cualquier origen (en producción, especifica los dominios permitidos)
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }

  // Headers permitidos - INCLUYE TODAS LAS VARIACIONES
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, X-Api-Key, X-API-KEY',
  );

  // Métodos permitidos
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );

  // Headers expuestos
  res.header(
    'Access-Control-Expose-Headers',
    'Content-Type, Authorization, x-api-key',
  );

  // No permitir credenciales
  res.header('Access-Control-Allow-Credentials', 'false');

  // Cache de preflight por 1 hora
  res.header('Access-Control-Max-Age', '3600');

  // Si es una petición OPTIONS (preflight), responder inmediatamente
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }

  next();
}
