import { useEffect, useCallback } from 'react';

// Hook pour monitoring des Core Web Vitals
export function usePerformanceMonitoring() {
  const reportMetric = useCallback((metric: any) => {
    // En production, envoyer à votre service d'analytics
    if (process.env.NODE_ENV === 'production') {
      // Analytics service call
      console.log('Performance metric:', metric);
    }
  }, []);

  useEffect(() => {
    // Mesurer les Core Web Vitals (simulation car web-vitals n'est pas installé)
    const measureWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // Mesurer LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          reportMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime > 2500 ? 'poor' : lastEntry.startTime > 1200 ? 'needs-improvement' : 'good'
          });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Mesurer FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            reportMetric({
              name: 'FCP',
              value: entry.startTime,
              rating: entry.startTime > 1800 ? 'poor' : entry.startTime > 1000 ? 'needs-improvement' : 'good'
            });
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      }
    };
    
    measureWebVitals();

    // Observer les ressources longues à charger
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) {
            reportMetric({
              name: 'long-task',
              value: entry.duration,
              url: window.location.pathname,
            });
          }
        }
      });

      observer.observe({ type: 'longtask', buffered: true });

      return () => observer.disconnect();
    }
  }, [reportMetric]);

  // Fonction pour mesurer les performances personnalisées
  const measureCustomMetric = useCallback((name: string, startTime?: number) => {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : endTime;
    
    reportMetric({
      name: `custom-${name}`,
      value: duration,
      url: window.location.pathname,
    });

    return duration;
  }, [reportMetric]);

  return { measureCustomMetric };
}

// Hook pour lazy loading d'images
export function useImageLazyLoading() {
  useEffect(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observer toutes les images avec data-src
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach((img) => imageObserver.observe(img));

      return () => imageObserver.disconnect();
    }
  }, []);
}

// Hook pour preload des ressources critiques
export function useResourcePreloading() {
  const preloadResource = useCallback((href: string, as: string, type?: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    
    document.head.appendChild(link);
  }, []);

  const prefetchResource = useCallback((href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
  }, []);

  return { preloadResource, prefetchResource };
}

// Hook pour monitoring des erreurs JavaScript
export function useErrorMonitoring() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Log error pour monitoring
      console.error('JavaScript Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        url: window.location.pathname,
      });
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      // Log unhandled promise rejection
      console.error('Unhandled Promise Rejection:', {
        reason: event.reason,
        url: window.location.pathname,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);
}

// Hook pour monitoring de la mémoire
export function useMemoryMonitoring() {
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };

      // Alert si utilisation mémoire > 80%
      if (usage.percentage > 80) {
        console.warn('High memory usage detected:', usage);
      }

      return usage;
    }
    return null;
  }, []);

  useEffect(() => {
    // Vérifier la mémoire toutes les minutes
    const interval = setInterval(checkMemoryUsage, 60000);
    
    return () => clearInterval(interval);
  }, [checkMemoryUsage]);

  return { checkMemoryUsage };
}