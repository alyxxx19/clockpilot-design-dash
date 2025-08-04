/**
 * Performance Optimization Utilities for ClockPilot Frontend
 * Provides caching, lazy loading, and performance monitoring capabilities
 */

// Local storage cache manager
class LocalStorageCache {
  private prefix = 'clockpilot_cache_';
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();
      
      if (now - parsed.timestamp > parsed.ttl) {
        this.remove(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn('Cache remove failed:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  // Cache for API responses
  setCachedApiResponse(endpoint: string, params: any, data: any, ttl?: number): void {
    const key = `api_${endpoint}_${JSON.stringify(params)}`;
    this.set(key, data, ttl);
  }

  getCachedApiResponse<T>(endpoint: string, params: any): T | null {
    const key = `api_${endpoint}_${JSON.stringify(params)}`;
    return this.get<T>(key);
  }
}

export const localCache = new LocalStorageCache();

// Image optimization utilities
export class ImageOptimizer {
  static createWebPSource(src: string): string {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  static generateSrcSet(src: string, sizes: number[]): string {
    return sizes
      .map(size => {
        const extension = src.split('.').pop();
        const baseName = src.replace(`.${extension}`, '');
        return `${baseName}_${size}w.${extension} ${size}w`;
      })
      .join(', ');
  }

  static createBlurPlaceholder(width: number, height: number): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f4f6'/%3E%3C/svg%3E`;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static startTiming(label: string): () => number {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(label)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  static getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || [];
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  static getAllMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};
    
    this.metrics.forEach((values, label) => {
      result[label] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
      };
    });
    
    return result;
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Resource preloading
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  static preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = src;
      
      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  static preloadStylesheet(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      link.onerror = reject;
      
      document.head.appendChild(link);
    });
  }

  static prefetchRoute(path: string): void {
    if (this.preloadedResources.has(path)) {
      return;
    }

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
    
    this.preloadedResources.add(path);
  }
}

// Bundle optimization helpers
export class BundleOptimizer {
  // Dynamically import components only when needed
  static async loadComponent<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
    const endTiming = PerformanceMonitor.startTiming('component-load');
    
    try {
      const module = await importFn();
      endTiming();
      return module.default;
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  // Chunk splitting for better caching
  static getChunkName(path: string): string {
    const segments = path.split('/');
    return segments[segments.length - 1] || 'unknown';
  }
}

// Memory optimization
export class MemoryOptimizer {
  private static observers = new Map<string, IntersectionObserver>();

  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observerId = Math.random().toString(36).substr(2, 9);
    const observer = new IntersectionObserver(callback, options);
    this.observers.set(observerId, observer);
    return observer;
  }

  static disconnectObserver(observer: IntersectionObserver): void {
    observer.disconnect();
    
    // Find and remove from our tracking
    for (const [id, obs] of this.observers.entries()) {
      if (obs === observer) {
        this.observers.delete(id);
        break;
      }
    }
  }

  static disconnectAllObservers(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  static checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };

      console.log('Memory Usage:', usage);
      
      if (usage.used / usage.limit > 0.8) {
        console.warn('High memory usage detected. Consider optimizing.');
      }
    }
  }
}

// Export main utilities
export const performanceUtils = {
  cache: localCache,
  image: ImageOptimizer,
  monitor: PerformanceMonitor,
  preloader: ResourcePreloader,
  bundle: BundleOptimizer,
  memory: MemoryOptimizer,
};