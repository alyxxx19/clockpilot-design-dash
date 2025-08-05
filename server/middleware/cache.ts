import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../redis';
import logger from '../logger';

// Middleware de cache Redis
export function cacheMiddleware(
  keyGenerator: (req: Request) => string,
  ttlSeconds: number = 300
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip cache pour les méthodes non-GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        // Cache hit
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }

      // Cache miss - intercepter la réponse
      const originalSend = res.json;
      res.json = function(data: any) {
        // Sauvegarder en cache seulement pour les réponses réussies
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttlSeconds).catch((error) => {
            logger.error('Cache set error:', { key: cacheKey, error });
          });
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

// Générateurs de clés de cache
export const cacheKeyGenerators = {
  employees: (req: Request) => {
    const { page = 1, limit = 20, search = '', department = '', contractType = '' } = req.query;
    const userId = (req as any).user?.id || 'anonymous';
    return `employees:${userId}:${page}:${limit}:${search}:${department}:${contractType}`;
  },

  employeeById: (req: Request) => {
    const { id } = req.params;
    return `employee:${id}`;
  },

  departments: (req: Request) => {
    return 'departments:all';
  },

  planning: (req: Request) => {
    const { date, employeeId } = req.query;
    return `planning:${date}:${employeeId || 'all'}`;
  },

  timeEntries: (req: Request) => {
    const { date, employeeId, status } = req.query;
    const userId = (req as any).user?.id;
    return `timeentries:${userId}:${date}:${employeeId || 'all'}:${status || 'all'}`;
  },

  stats: (req: Request) => {
    const { period = 'week' } = req.query;
    const userId = (req as any).user?.id;
    return `stats:${userId}:${period}`;
  },

  notifications: (req: Request) => {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20 } = req.query;
    return `notifications:${userId}:${page}:${limit}`;
  },
};

// Middleware d'invalidation de cache
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    
    res.json = function(data: any) {
      // Invalider le cache après une modification réussie
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern).catch((error) => {
            logger.error('Cache invalidation error:', { pattern, error });
          });
        });
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

// Middleware de compression des réponses
export function compressionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    
    res.json = function(data: any) {
      // Ajouter les headers de compression si la réponse est grande
      const dataString = JSON.stringify(data);
      if (dataString.length > 1024) { // > 1KB
        res.setHeader('Content-Encoding', 'gzip');
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}

// Middleware ETag pour cache HTTP
export function etagMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    
    res.json = function(data: any) {
      const dataString = JSON.stringify(data);
      const etag = `"${Buffer.from(dataString).toString('base64').slice(0, 16)}"`;
      
      res.setHeader('ETag', etag);
      
      // Vérifier If-None-Match header
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === etag) {
        return res.status(304).end();
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
}