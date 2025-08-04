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

export const createTestPlanningEntry = () => ({
  id: 1,
  employeeId: 1,
  date: '2024-08-03',
  startTime: '09:00',
  endTime: '17:00',
  breakDuration: 60,
  plannedHours: 7,
  status: 'planned' as const,
  notes: 'Test planning',
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestProject = () => ({
  id: 1,
  name: 'Test Project',
  description: 'A test project for development',
  client_name: 'Test Client',
  status: 'active' as const,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  budget: '50000.00',
  hourly_rate: '100.00',
  created_by: 1,
  created_at: new Date(),
  updated_at: new Date()
});

export const createTestTask = () => ({
  id: 1,
  title: 'Test Task',
  description: 'A test task for development',
  project_id: 1,
  assigned_to: 1,
  created_by: 1,
  status: 'todo' as const,
  priority: 'medium' as const,
  due_date: '2024-08-10',
  estimated_hours: '8.0',
  actual_hours: null,
  completion_percentage: 0,
  tags: ['frontend', 'testing'],
  created_at: new Date(),
  updated_at: new Date()
});

export const createTestDepartment = () => ({
  id: 1,
  name: 'IT Department',
  description: 'Information Technology Department',
  managerId: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const createTestNotification = () => ({
  id: 1,
  userId: 1,
  type: 'planning_conflict' as const,
  title: 'Planning Conflict Detected',
  message: 'Overlap detected in your schedule',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Helper pour créer un token JWT valide
export const createTestJWT = (userId: number, role: string = 'employee') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, role, email: 'test@clockpilot.com' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Helper pour créer des données de conflit
export const createConflictingEntries = () => [
  {
    ...createTestPlanningEntry(),
    id: 1,
    startTime: '09:00',
    endTime: '13:00'
  },
  {
    ...createTestPlanningEntry(),
    id: 2,
    startTime: '12:00',
    endTime: '16:00'
  }
];

// Helper pour créer des données de violation légale
export const createLegalViolationEntry = () => ({
  ...createTestTimeEntry(),
  startTime: '06:00',
  endTime: '20:00', // 14 heures - violation de la limite quotidienne
  breakDuration: 60
});

// Mock storage helpers
export const createMockStorage = () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  getEmployeeByUserId: jest.fn(),
  createEmployee: jest.fn(),
  getEmployees: jest.fn(),
  updateEmployee: jest.fn(),
  deleteEmployee: jest.fn(),
  getPlanningEntries: jest.fn(),
  createPlanningEntry: jest.fn(),
  updatePlanningEntry: jest.fn(),
  deletePlanningEntry: jest.fn(),
  getTimeEntries: jest.fn(),
  createTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),
  deleteTimeEntry: jest.fn(),
  getProjects: jest.fn(),
  createProject: jest.fn(),
  updateProject: jest.fn(),
  getTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  getNotifications: jest.fn(),
  createNotification: jest.fn(),
  markNotificationAsRead: jest.fn()
});