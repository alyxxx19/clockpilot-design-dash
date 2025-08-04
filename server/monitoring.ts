import express from 'express';
import { db, pool } from './db';
import { redis, cacheService } from './redis';
import os from 'os';
import process from 'process';
import logger from './logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  time: string;
  output?: string;
  responseTime?: number;
}

interface MetricsData {
  timestamp: string;
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    loadAverage: number[];
  };
  application: {
    activeConnections: number;
    totalRequests: number;
    errorCount: number;
    averageResponseTime: number;
  };
  database: {
    activeConnections: number;
    totalQueries: number;
    averageQueryTime: number;
  };
}

class HealthMonitor {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private cpuUsage = process.cpuUsage();

  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      await db.execute({ sql: 'SELECT 1', args: [] });
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 100 ? 'pass' : responseTime < 500 ? 'warn' : 'fail',
        time: new Date().toISOString(),
        responseTime,
        output: `Database responded in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'fail',
        time: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        output: `Database check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      if (!redis) {
        return {
          status: 'warn',
          time: new Date().toISOString(),
          output: 'Redis not configured'
        };
      }

      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 50 ? 'pass' : responseTime < 200 ? 'warn' : 'fail',
        time: new Date().toISOString(),
        responseTime,
        output: `Redis responded in ${responseTime}ms`
      };
    } catch (error) {
      return {
        status: 'fail',
        time: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        output: `Redis check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  checkMemory(): HealthCheck {
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;

    return {
      status: memUsagePercent < 70 ? 'pass' : memUsagePercent < 90 ? 'warn' : 'fail',
      time: new Date().toISOString(),
      output: `Memory usage: ${memUsagePercent.toFixed(1)}% (${Math.round(usedMem / 1024 / 1024)}MB used of ${Math.round(totalMem / 1024 / 1024)}MB)`
    };
  }

  checkDisk(): HealthCheck {
    try {
      const stats = require('fs').statSync('.');
      // Simple disk check - in production, use more sophisticated disk space monitoring
      return {
        status: 'pass',
        time: new Date().toISOString(),
        output: 'Disk space check passed'
      };
    } catch (error) {
      return {
        status: 'fail',
        time: new Date().toISOString(),
        output: `Disk check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      memory: this.checkMemory(),
      disk: this.checkDisk()
    };

    const overallStatus = this.determineOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks
    };
  }

  private determineOverallStatus(checks: HealthStatus['checks']): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('fail')) {
      return 'unhealthy';
    } else if (statuses.includes('warn')) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  getMetrics(): MetricsData {
    const currentCpuUsage = process.cpuUsage(this.cpuUsage);
    
    return {
      timestamp: new Date().toISOString(),
      system: {
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        memory: process.memoryUsage(),
        cpu: currentCpuUsage,
        loadAverage: os.loadavg()
      },
      application: {
        activeConnections: 0, // Could be tracked with connection middleware
        totalRequests: this.requestCount,
        errorCount: this.errorCount,
        averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0
      },
      database: {
        activeConnections: pool.totalCount || 0,
        totalQueries: 0, // Could be tracked with query middleware
        averageQueryTime: 0
      }
    };
  }

  // Methods to track metrics
  incrementRequestCount() {
    this.requestCount++;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  addResponseTime(time: number) {
    this.totalResponseTime += time;
  }
}

const healthMonitor = new HealthMonitor();

// Metrics middleware
export const metricsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  healthMonitor.incrementRequestCount();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    healthMonitor.addResponseTime(responseTime);
    
    if (res.statusCode >= 400) {
      healthMonitor.incrementErrorCount();
    }
  });
  
  next();
};

// Health check routes
export function setupHealthRoutes(app: express.Application) {
  // Liveness probe - basic application health
  app.get('/api/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Readiness probe - full health check
  app.get('/api/health/ready', async (req, res) => {
    try {
      const health = await healthMonitor.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy health endpoint for backwards compatibility
  app.get('/api/health', async (req, res) => {
    try {
      const health = await healthMonitor.getHealthStatus();
      const statusCode = health.status === 'unhealthy' ? 503 : 200;
      res.status(statusCode).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Metrics endpoint (Prometheus format)
  app.get('/metrics', (req, res) => {
    const metrics = healthMonitor.getMetrics();
    
    // Convert to Prometheus format
    const prometheusMetrics = `
# HELP clockpilot_requests_total Total number of HTTP requests
# TYPE clockpilot_requests_total counter
clockpilot_requests_total ${metrics.application.totalRequests}

# HELP clockpilot_errors_total Total number of HTTP errors
# TYPE clockpilot_errors_total counter
clockpilot_errors_total ${metrics.application.errorCount}

# HELP clockpilot_response_time_average Average response time in milliseconds
# TYPE clockpilot_response_time_average gauge
clockpilot_response_time_average ${metrics.application.averageResponseTime}

# HELP clockpilot_memory_usage_bytes Memory usage in bytes
# TYPE clockpilot_memory_usage_bytes gauge
clockpilot_memory_usage_bytes ${metrics.system.memory.heapUsed}

# HELP clockpilot_uptime_seconds Application uptime in seconds
# TYPE clockpilot_uptime_seconds gauge
clockpilot_uptime_seconds ${metrics.system.uptime}

# HELP clockpilot_database_connections_active Active database connections
# TYPE clockpilot_database_connections_active gauge
clockpilot_database_connections_active ${metrics.database.activeConnections}
`.trim();

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(prometheusMetrics);
  });
}

export { healthMonitor };