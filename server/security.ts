import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import express from 'express';

// Enhanced rate limiting with different tiers
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests for some endpoints
    skip: (req) => {
      // Skip rate limiting for health checks in production
      return req.path.startsWith('/api/health') || req.path === '/metrics';
    }
  });
};

// Different rate limits for different endpoint types
export const authRateLimit = createRateLimiter(15 * 60 * 1000, 5); // 5 login attempts per 15 minutes
export const apiRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 API calls per 15 minutes
export const strictRateLimit = createRateLimiter(60 * 1000, 10); // 10 requests per minute for sensitive operations

// Enhanced security headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Enhanced compression with security considerations
export const compressionMiddleware = compression({
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses that shouldn't be compressed
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Request timeout middleware
export const timeoutMiddleware = (timeout: number = 30000) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setTimeout(timeout, () => {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT'
      });
    });
    next();
  };
};

// Security audit logging middleware
export const securityAuditMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log security-sensitive events
  const sensitiveEndpoints = ['/api/auth', '/api/admin', '/api/users'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.startsWith(endpoint));
  
  if (isSensitive) {
    console.log(`[SECURITY] ${req.method} ${req.path} from ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  }
  
  next();
};

// IP whitelisting middleware for admin endpoints
export const adminWhitelistMiddleware = (whitelist: string[] = []) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (whitelist.length === 0 || process.env.NODE_ENV !== 'production') {
      return next();
    }
    
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!clientIP || !whitelist.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'IP_NOT_WHITELISTED'
      });
    }
    
    next();
  };
};