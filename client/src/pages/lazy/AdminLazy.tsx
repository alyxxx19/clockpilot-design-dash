import { lazy } from 'react';
import { LazyComponent } from '@/components/LazyComponent';

// Lazy loading des pages admin (simulation des imports)
const EmployeesPage = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve({ default: () => <div>Employees Page</div> }), 100)
  )
);
const PlanningPage = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve({ default: () => <div>Planning Page</div> }), 100)
  )
);
const TimeEntriesPage = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve({ default: () => <div>Time Entries Page</div> }), 100)
  )
);
const NotificationsPage = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve({ default: () => <div>Notifications Page</div> }), 100)
  )
);

// Composants wrappés avec lazy loading
export const LazyEmployeesPage = () => (
  <LazyComponent>
    <EmployeesPage />
  </LazyComponent>
);

export const LazyPlanningPage = () => (
  <LazyComponent>
    <PlanningPage />
  </LazyComponent>
);

export const LazyTimeEntriesPage = () => (
  <LazyComponent>
    <TimeEntriesPage />
  </LazyComponent>
);

export const LazyNotificationsPage = () => (
  <LazyComponent>
    <NotificationsPage />
  </LazyComponent>
);

// Preload fonction pour les routes critiques
export const preloadAdminRoutes = () => {
  // Preload les pages admin couramment utilisées (simulation)
  console.log('Preloading admin routes...');
};