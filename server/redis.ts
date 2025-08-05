import Redis from 'ioredis';
import logger from './logger';
import { env } from '../shared/env';

// Configuration Redis
const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: 0, // Default database
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  // Configuration pour la production
  keyPrefix: `clockpilot:${env.NODE_ENV}:`,
};

// Instance Redis principale
export const redis = new Redis(redisConfig);

// Gestion des événements Redis
redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('ready', () => {
  logger.info('Redis ready to receive commands');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

// Service de cache avec méthodes utilitaires
export class CacheService {
  private redis: Redis;
  
  constructor(redisInstance: Redis = redis) {
    this.redis = redisInstance;
  }

  // Cache simple avec TTL
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      logger.error('Cache set error:', { key, error });
      throw error;
    }
  }

  // Récupération du cache
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  // Suppression du cache
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  // Cache avec pattern d'invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache pattern invalidation error:', { pattern, error });
    }
  }

  // Cache pour les sessions utilisateur
  async setUserSession(userId: string, sessionData: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`session:${userId}`, sessionData, ttlSeconds);
  }

  async getUserSession(userId: string): Promise<any | null> {
    return this.get(`session:${userId}`);
  }

  async deleteUserSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  // Cache pour les données d'employés
  async setEmployeeData(employeeId: number, data: any, ttlSeconds: number = 600): Promise<void> {
    await this.set(`employee:${employeeId}`, data, ttlSeconds);
  }

  async getEmployeeData(employeeId: number): Promise<any | null> {
    return this.get(`employee:${employeeId}`);
  }

  async invalidateEmployeeCache(employeeId?: number): Promise<void> {
    if (employeeId) {
      await this.del(`employee:${employeeId}`);
    } else {
      await this.invalidatePattern('employee:*');
    }
  }

  // Cache pour les départements
  async setDepartments(departments: any[], ttlSeconds: number = 3600): Promise<void> {
    await this.set('departments:all', departments, ttlSeconds);
  }

  async getDepartments(): Promise<any[] | null> {
    return this.get('departments:all');
  }

  async invalidateDepartmentsCache(): Promise<void> {
    await this.del('departments:all');
  }

  // Cache pour les statistiques
  async setStats(key: string, stats: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`stats:${key}`, stats, ttlSeconds);
  }

  async getStats(key: string): Promise<any | null> {
    return this.get(`stats:${key}`);
  }

  async invalidateStatsCache(): Promise<void> {
    await this.invalidatePattern('stats:*');
  }

  // Cache pour les notifications
  async setUserNotifications(userId: string, notifications: any[], ttlSeconds: number = 300): Promise<void> {
    await this.set(`notifications:${userId}`, notifications, ttlSeconds);
  }

  async getUserNotifications(userId: string): Promise<any[] | null> {
    return this.get(`notifications:${userId}`);
  }

  async invalidateUserNotifications(userId: string): Promise<void> {
    await this.del(`notifications:${userId}`);
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const current = await this.redis.incr(`ratelimit:${key}`);
      
      if (current === 1) {
        await this.redis.expire(`ratelimit:${key}`, windowSeconds);
      }
      
      const ttl = await this.redis.ttl(`ratelimit:${key}`);
      const resetTime = Date.now() + (ttl * 1000);
      
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime
      };
    } catch (error) {
      logger.error('Rate limit check error:', { key, error });
      // En cas d'erreur, autoriser la requête
      return { allowed: true, remaining: limit, resetTime: Date.now() + windowSeconds * 1000 };
    }
  }

  // Vérification de santé
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Statistiques Redis
  async getInfo(): Promise<any> {
    try {
      const info = await this.redis.info();
      return info;
    } catch (error) {
      logger.error('Redis info error:', error);
      return null;
    }
  }
}

// Instance du service de cache
export const cacheService = new CacheService();

// Middleware pour vérifier la disponibilité de Redis
export async function checkRedisHealth(): Promise<boolean> {
  return cacheService.healthCheck();
}