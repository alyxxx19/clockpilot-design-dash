import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import winston from 'winston';
import express, { type Express, Request, Response, NextFunction } from 'express';

// Configuration du logger Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'clockpilot-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// En développement, log aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Configuration CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://clockpilot.com',
      'https://app.clockpilot.com'
    ];
    
    // Permettre les requêtes sans origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par la politique CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Rate limiting général
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Trop de requêtes depuis cette IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting pour les health checks
    return req.path === '/api/health';
  },
});

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    error: 'Trop de tentatives de connexion',
    code: 'AUTH_LIMIT_EXCEEDED',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiting pour les opérations sensibles
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requêtes max
  message: {
    error: 'Limite de requêtes dépassée pour cette opération',
    code: 'STRICT_LIMIT_EXCEEDED',
    retryAfter: '1 minute'
  },
});

// Configuration Helmet pour les headers de sécurité
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
};

// Middleware de logging des requêtes
const requestLogger = morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
  skip: (req: Request) => {
    // Ne pas logger les health checks en production
    return process.env.NODE_ENV === 'production' && req.path === '/api/health';
  }
});

// Middleware de gestion des erreurs
const errorHandler = (
  error: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Erreur API:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue' 
      : error.message,
    code: errorCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

// Middleware de validation des requêtes JSON
const validateJSON = (
  error: Error & { type?: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Format JSON invalide',
      code: 'INVALID_JSON',
    });
  }
  next(error);
};

// Middleware de sécurité pour les uploads
const uploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Vérifier la taille max des fichiers
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: 'Fichier trop volumineux',
      code: 'FILE_TOO_LARGE',
      maxSize: '50MB',
    });
  }

  // Vérifier les types MIME autorisés pour les uploads
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/csv', 'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const contentType = req.headers['content-type'];
  if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
    return res.status(415).json({
      error: 'Type de fichier non supporté',
      code: 'UNSUPPORTED_FILE_TYPE',
      allowedTypes,
    });
  }

  next();
};

// Configuration de la sécurité
export function setupSecurity(app: Express) {
  // Trust proxy pour les headers X-Forwarded-*
  app.set('trust proxy', 1);

  // Compression gzip
  app.use(compression());

  // Headers de sécurité
  app.use(helmet(helmetConfig));

  // CORS
  app.use(cors(corsOptions));

  // Logging des requêtes
  if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
    app.use(requestLogger);
  }

  // Note: JSON et URL-encoded parsing sont configurés dans index.ts

  // Validation JSON
  app.use(validateJSON);

  // Rate limiting général
  app.use('/api', generalLimiter);

  return {
    authLimiter,
    strictLimiter,
    uploadSecurity,
    errorHandler,
    logger,
  };
}

// Health check endpoint
export function setupHealthCheck(app: Express) {
  app.get('/api/health', (req: Request, res: Response) => {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      pid: process.pid,
    };

    res.status(200).json(healthCheck);
  });

  // Readiness probe (pour Kubernetes)
  app.get('/api/ready', async (req: Request, res: Response) => {
    try {
      // Vérifier la connexion DB ici si nécessaire
      res.status(200).json({ status: 'ready' });
    } catch (error: any) {
      logger.error('Readiness check failed:', error);
      res.status(503).json({ status: 'not ready', error: error?.message || 'Unknown error' });
    }
  });

  // Liveness probe (pour Kubernetes)
  app.get('/api/live', (req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
  });
}

export { logger };