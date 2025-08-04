import { Suspense, ComponentType, ReactNode } from 'react';

interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyComponent({ fallback, children }: LazyComponentProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
  
  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

// HOC for lazy loading components
export function withLazyLoading<T extends Record<string, any>>(
  Component: ComponentType<T>,
  fallback?: ReactNode
) {
  return function LazyWrappedComponent(props: T) {
    return (
      <LazyComponent fallback={fallback}>
        <Component {...props} />
      </LazyComponent>
    );
  };
}

// Preloader for critical routes
export function preloadRoute(routeImport: () => Promise<any>) {
  // Start loading the route component
  routeImport().catch(() => {
    // Ignore errors during preloading
  });
}

// Component for image lazy loading with WebP support
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  sizes?: string;
  width?: number;
  height?: number;
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3C/svg%3E",
  sizes,
  width,
  height
}: LazyImageProps) {
  // Create WebP source with fallback
  const webpSrc = src.replace(/\.(jpe?g|png)$/i, '.webp');
  
  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        sizes={sizes}
        width={width}
        height={height}
        style={{
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    </picture>
  );
}