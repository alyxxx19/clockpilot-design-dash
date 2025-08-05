import { z } from 'zod';

const envSchema = z.object({
  // Base Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  BASE_URL: z.string().url().optional(),
  
  // Database Configuration
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_POOL_SIZE: z.string().transform((val) => parseInt(val, 10)).default('20'),
  PGHOST: z.string().optional(),
  PGPORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  
  // Authentication & Security
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default('dev-jwt-secret-32chars-minimum-length').refine(
    (val) => process.env.NODE_ENV === 'development' || val.length >= 32,
    'JWT_SECRET must be at least 32 characters in production'
  ),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required').default('dev-jwt-refresh-secret-32chars-minimum').refine(
    (val) => process.env.NODE_ENV === 'development' || val.length >= 32,
    'JWT_REFRESH_SECRET must be at least 32 characters in production'
  ),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required').default('dev-session-secret-32chars-minimum-length').refine(
    (val) => process.env.NODE_ENV === 'development' || val.length >= 32,
    'SESSION_SECRET must be at least 32 characters in production'
  ),
  
  // Database Seeding (Development Only)
  SEED_PASSWORD_HASH: z.string().optional(),
  
  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // Object Storage (S3)
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  DEFAULT_OBJECT_STORAGE_BUCKET_ID: z.string().optional(),
  PRIVATE_OBJECT_DIR: z.string().optional(),
  PUBLIC_OBJECT_SEARCH_PATHS: z.string().optional(),
  
  // Monitoring & Analytics
  SENTRY_DSN: z.string().optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  
  // Feature Flags
  ENABLE_GEOLOCATION: z.string().transform(v => v === 'true').default('false'),
  ENABLE_OFFLINE_MODE: z.string().transform(v => v === 'true').default('false'),
  ENABLE_PUSH_NOTIFICATIONS: z.string().transform(v => v === 'true').default('false'),
  
  // External APIs
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  CALENDLY_URL: z.string().url().optional(),
  
  // Redis Configuration
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // Notification Settings
  NOTIFICATION_EMAIL_ENABLED: z.string().transform(v => v === 'true').default('true'),
  NOTIFICATION_PUSH_ENABLED: z.string().transform(v => v === 'true').default('true'),
  WEBHOOK_SECRET: z.string().optional(),
  
  // File Upload Settings
  MAX_FILE_SIZE: z.string().transform((val) => parseInt(val, 10)).default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('jpg,jpeg,png,pdf,xlsx,csv'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
  
  // SSL Configuration
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  
  // Backup Configuration
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform((val) => parseInt(val, 10)).default('30'),
  BACKUP_S3_BUCKET: z.string().optional(),
  
  // Performance
  CACHE_TTL: z.string().transform((val) => parseInt(val, 10)).default('3600'),
  MAX_CONNECTIONS: z.string().transform((val) => parseInt(val, 10)).default('100'),
  CLUSTER_WORKERS: z.string().default('auto'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

type Env = z.infer<typeof envSchema>;

// Environment validation function
const parseEnv = (): Env => {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional validation for production environment
    if (parsed.NODE_ENV === 'production') {
      const requiredInProduction = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET', 
        'SESSION_SECRET',
        'DATABASE_URL'
      ];
      
      const missing = requiredInProduction.filter(key => 
        !process.env[key] || process.env[key]!.length < 32
      );
      
      if (missing.length > 0) {
        console.error('❌ Production environment validation failed:');
        missing.forEach(key => {
          console.error(`   ${key}: Required in production with minimum 32 characters`);
        });
        process.exit(1);
      }
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`   ${err.path.join('.')}: ${err.message}`);
      });
      
      // Log current environment in development for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('\n💡 Current environment variables:');
        Object.keys(envSchema.shape).forEach(key => {
          const value = process.env[key];
          if (value) {
            // Mask sensitive values
            const sensitiveKeys = ['SECRET', 'PASSWORD', 'KEY', 'TOKEN'];
            const isSensitive = sensitiveKeys.some(s => key.includes(s));
            console.error(`   ${key}: ${isSensitive ? '[MASKED]' : value}`);
          } else {
            console.error(`   ${key}: [NOT SET]`);
          }
        });
      }
      
      process.exit(1);
    }
    throw error;
  }
};

// Initialize and export validated environment
export const env = parseEnv();

// Export the type for TypeScript
export type { Env };

// Runtime environment checker
export const isProduction = () => env.NODE_ENV === 'production';
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isTest = () => env.NODE_ENV === 'test';

// Helper to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof Pick<Env, 'ENABLE_GEOLOCATION' | 'ENABLE_OFFLINE_MODE' | 'ENABLE_PUSH_NOTIFICATIONS'>) => {
  return env[feature];
};

// Safe environment export for client-side (only non-sensitive values)
export const getClientEnv = () => ({
  NODE_ENV: env.NODE_ENV,
  BASE_URL: env.BASE_URL,
  ENABLE_GEOLOCATION: env.ENABLE_GEOLOCATION,
  ENABLE_OFFLINE_MODE: env.ENABLE_OFFLINE_MODE,
  ENABLE_PUSH_NOTIFICATIONS: env.ENABLE_PUSH_NOTIFICATIONS,
  GOOGLE_MAPS_API_KEY: env.GOOGLE_MAPS_API_KEY,
  CALENDLY_URL: env.CALENDLY_URL,
});