import { DatabaseStorage } from '../../server/storage';

// Setup global pour les tests backend
beforeAll(async () => {
  // Initialiser la base de données de test si nécessaire
  // await setupTestDatabase();
});

afterAll(async () => {
  // Nettoyer les ressources
  // await cleanupTestDatabase();
});

beforeEach(() => {
  // Réinitialiser les mocks avant chaque test
  jest.clearAllMocks();
});

// Mock de la base de données pour les tests
jest.mock('../../server/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  pool: {
    end: jest.fn()
  }
}));

// Helper pour créer des données de test
export const createTestUser = () => ({
  id: 1,
  email: 'test@clockpilot.com',
  hashedPassword: '$2b$04$test.hash.password',
  role: 'employee' as const,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestEmployee = () => ({
  id: 1,
  userId: 1,
  firstName: 'John',
  lastName: 'Doe',
  userEmail: 'john.doe@clockpilot.com',
  departmentId: 1,
  departmentName: 'IT',
  managerId: null,
  hireDate: '2024-01-01',
  contractType: 'CDI' as const,
  weeklyHours: 35,
  isActive: true,
  hasPhone: true,
  hasEmail: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestTimeEntry = () => ({
  id: '1',
  employeeId: 1,
  date: '2024-08-03',
  startTime: '09:00',
  endTime: '17:00',
  breakDuration: 60,
  workedHours: 7,
  overtimeHours: 0,
  status: 'draft' as const,
  notes: 'Test entry',
  validatedAt: null,
  validatedBy: null,
  createdAt: new Date(),
  updatedAt: new Date()
});