import { Request, Response, NextFunction } from 'express';
import { logger } from '../security';

// Middleware pour optimiser les requêtes de base de données
export function queryOptimizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Intercepter les réponses pour mesurer les performances
    const originalSend = res.json;
    res.json = function(data: any) {
      const duration = Date.now() - startTime;
      
      // Logger les requêtes lentes (> 1 seconde)
      if (duration > 1000) {
        logger.warn('Slow API response detected:', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`,
          query: req.query,
          userAgent: req.get('User-Agent'),
        });
      }
      
      // Ajouter les headers de performance
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Timestamp', new Date().toISOString());
      
      return originalSend.call(this, data);
    };

    next();
  };
}

// Middleware pour la pagination optimisée
export function paginationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Valider et optimiser les paramètres de pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    
    // Ajouter les paramètres optimisés à la requête
    req.query.page = page.toString();
    req.query.limit = limit.toString();
    req.query.offset = offset.toString();
    
    next();
  };
}

// Middleware pour sélectionner seulement les champs nécessaires
export function selectFieldsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Parser le paramètre 'fields' pour sélectionner seulement les champs demandés
    const fields = req.query.fields as string;
    if (fields) {
      const selectedFields = fields.split(',').map(field => field.trim());
      
      // Valider les champs autorisés (sécurité)
      const allowedFields = {
        employees: ['id', 'firstName', 'lastName', 'email', 'departmentId', 'contractType', 'weeklyHours', 'isActive'],
        departments: ['id', 'name', 'description'],
        timeEntries: ['id', 'employeeId', 'date', 'startTime', 'endTime', 'workedHours', 'status'],
        planning: ['id', 'employeeId', 'date', 'startTime', 'endTime', 'status'],
        notifications: ['id', 'type', 'title', 'message', 'isRead', 'createdAt'],
      };
      
      // Déterminer l'entité basée sur l'URL
      let entity = '';
      if (req.url.includes('/employees')) entity = 'employees';
      else if (req.url.includes('/departments')) entity = 'departments';
      else if (req.url.includes('/time-entries')) entity = 'timeEntries';
      else if (req.url.includes('/planning')) entity = 'planning';
      else if (req.url.includes('/notifications')) entity = 'notifications';
      
      if (entity && allowedFields[entity as keyof typeof allowedFields]) {
        const validFields = selectedFields.filter(field => 
          allowedFields[entity as keyof typeof allowedFields].includes(field)
        );
        
        if (validFields.length > 0) {
          req.query.select = validFields.join(',');
        }
      }
    }
    
    next();
  };
}

// Middleware pour les filtres avancés et optimisés
export function advancedFiltersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const filters: any = {};
    
    // Traiter les différents types de filtres
    Object.keys(req.query).forEach(key => {
      const value = req.query[key] as string;
      
      // Filtres de date
      if (key.endsWith('_from') || key.endsWith('_to')) {
        const fieldName = key.replace(/_from|_to/, '');
        if (!filters[fieldName]) filters[fieldName] = {};
        
        if (key.endsWith('_from')) {
          filters[fieldName].gte = value;
        } else {
          filters[fieldName].lte = value;
        }
      }
      // Filtres de recherche
      else if (key === 'search') {
        filters.search = {
          term: value,
          fields: ['firstName', 'lastName', 'email'] // Champs de recherche par défaut
        };
      }
      // Filtres d'égalité
      else if (['department', 'contractType', 'status', 'type'].includes(key)) {
        filters[key] = value;
      }
      // Filtres de range
      else if (key.endsWith('_min') || key.endsWith('_max')) {
        const fieldName = key.replace(/_min|_max/, '');
        if (!filters[fieldName]) filters[fieldName] = {};
        
        if (key.endsWith('_min')) {
          filters[fieldName].gte = parseFloat(value);
        } else {
          filters[fieldName].lte = parseFloat(value);
        }
      }
    });
    
    // Ajouter les filtres optimisés à la requête
    req.query.filters = JSON.stringify(filters);
    
    next();
  };
}

// Middleware pour la limitation de la bande passante
export function bandwidthLimitMiddleware(maxSizeKB: number = 1024) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.json;
    
    res.json = function(data: any) {
      const dataString = JSON.stringify(data);
      const sizeKB = Buffer.byteLength(dataString, 'utf8') / 1024;
      
      if (sizeKB > maxSizeKB) {
        logger.warn('Large response detected:', {
          url: req.url,
          sizeKB: Math.round(sizeKB),
          maxSizeKB,
        });
        
        // Ajouter un header d'avertissement
        res.setHeader('X-Response-Size-Warning', `${Math.round(sizeKB)}KB exceeds ${maxSizeKB}KB limit`);
      }
      
      // Ajouter la taille de la réponse dans les headers
      res.setHeader('X-Response-Size', `${Math.round(sizeKB)}KB`);
      
      return originalSend.call(this, data);
    };

    next();
  };
}