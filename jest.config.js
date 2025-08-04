/** @type {import('jest').Config} */
export default {
  // Environnements de test
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/server/**/*.test.{ts,js}'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/backend.setup.ts'],
      collectCoverageFrom: [
        'server/**/*.{ts,js}',
        '!server/**/*.d.ts',
        '!server/index.ts',
        '!server/vite.ts'
      ],
      coverageDirectory: '<rootDir>/coverage/backend',
      coverageReporters: ['text', 'lcov', 'html'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/client/**/*.test.{ts,tsx,js,jsx}'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/frontend.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@assets/(.*)$': '<rootDir>/attached_assets/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx'
          }
        }]
      },
      collectCoverageFrom: [
        'client/src/**/*.{ts,tsx}',
        '!client/src/**/*.d.ts',
        '!client/src/main.tsx',
        '!client/src/vite-env.d.ts'
      ],
      coverageDirectory: '<rootDir>/coverage/frontend',
      coverageReporters: ['text', 'lcov', 'html'],
      coverageThreshold: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    }
  ],
  
  // Configuration globale
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.{ts,js}',
    'client/src/**/*.{ts,tsx}',
    'shared/**/*.{ts,js}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // Rapports de couverture combinés
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text-summary', 'lcov', 'html'],
  
  // Timeout pour les tests longs
  testTimeout: 10000,
  
  // Variables d'environnement pour les tests
  setupFiles: ['<rootDir>/tests/setup/env.setup.ts'],
  
  // Configuration ESM
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};