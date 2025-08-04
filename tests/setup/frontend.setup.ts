import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router } from 'wouter';

// Configuration globale pour React Testing Library
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
});

// Mock Service Worker pour les requêtes API
export const server = setupServer(
  // Auth endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: 1,
        email: 'test@clockpilot.com',
        role: 'employee'
      }
    });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      token: 'mock-new-jwt-token'
    });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 1,
      email: 'test@clockpilot.com',
      role: 'employee'
    });
  }),

  // Employees endpoints
  http.get('/api/employees', () => {
    return HttpResponse.json({
      data: [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          userEmail: 'john.doe@clockpilot.com',
          departmentName: 'IT',
          contractType: 'CDI',
          isActive: true
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    });
  }),

  // Time entries endpoints
  http.get('/api/time-entries', () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          employeeId: 1,
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:00',
          workedHours: 7,
          status: 'draft'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    });
  })
);

// Établir les mocks API avant tous les tests
beforeAll(() => server.listen());

// Réinitialiser les handlers après chaque test
afterEach(() => server.resetHandlers());

// Nettoyer après tous les tests
afterAll(() => server.close());

// Mock de window.location pour les tests de navigation
Object.defineProperty(window, 'location', {
  value: {
    assign: jest.fn(),
    replace: jest.fn(),
    href: 'http://localhost:3000'
  },
  writable: true
});

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Types pour le test wrapper
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialLocation?: string;
  queryClient?: QueryClient;
}

// Helper pour créer un wrapper de test avec providers
export const renderWithProviders = (
  ui: ReactNode,
  {
    initialLocation = '/',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Router base={initialLocation}>
        {children}
      </Router>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Re-export everything
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';