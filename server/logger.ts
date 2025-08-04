import winston from 'winston';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Define log levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: logFormat,
  defaultMeta: {
    service: 'clockpilot',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    
    // Application log file
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    )
  }));
}

// HTTP request logging format
export const httpLogFormat = 'combined';

// Security logging
export const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'clockpilot-security',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 20,
    }),
  ],
});

// Performance logging
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'clockpilot-performance',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Audit logging for compliance
export const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'clockpilot-audit',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 50, // Keep more audit logs for compliance
    }),
  ],
});

// Export structured logging functions
export const loggers = {
  app: logger,
  security: securityLogger,
  performance: performanceLogger,
  audit: auditLogger,
};

// Helper functions for different types of logging
export const logSecurityEvent = (event: string, details: any, req?: any) => {
  securityLogger.info('Security Event', {
    event,
    ...details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
};

export const logPerformanceMetric = (metric: string, value: number, details?: any) => {
  performanceLogger.info('Performance Metric', {
    metric,
    value,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export const logAuditEvent = (action: string, userId: number, details: any) => {
  auditLogger.info('Audit Event', {
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

export default logger;