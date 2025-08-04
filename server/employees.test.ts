import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { 
  createTestUser, 
  createTestEmployee, 
  createTestDepartment,
  createTestJWT,
  createMockStorage 
} from '../tests/setup/backend.setup';

// Mock de la base de données et du storage
jest.mock('./storage');
jest.mock('./db');

describe('Employees API Tests', () => {
  let app: express.Express;
  let mockStorage: jest.Mocked<DatabaseStorage>;
  let authToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    
    mockStorage = new DatabaseStorage() as jest.Mocked<DatabaseStorage>;
    authToken = createTestJWT(1, 'admin');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/employees', () => {
    it('should fetch employees with pagination', async () => {
      const testEmployees = [
        createTestEmployee(),
        { ...createTestEmployee(), id: 2, firstName: 'Jane', lastName: 'Smith' }
      ];

      mockStorage.getEmployeesWithFilters = jest.fn().mockResolvedValue({
        employees: testEmployees,
        total: 2,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/employees?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.employees).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.page).toBe(1);
      expect(mockStorage.getEmployeesWithFilters).toHaveBeenCalledWith({
        page: 1,
        limit: 10
      });
    });

    it('should filter employees by department', async () => {
      const testEmployees = [createTestEmployee()];

      mockStorage.getEmployeesWithFilters = jest.fn().mockResolvedValue({
        employees: testEmployees,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/employees?departmentId=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(mockStorage.getEmployeesWithFilters).toHaveBeenCalledWith({
        departmentId: 1
      });
    });

    it('should search employees by name', async () => {
      const testEmployees = [createTestEmployee()];

      mockStorage.getEmployeesWithFilters = jest.fn().mockResolvedValue({
        employees: testEmployees,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/employees?search=John')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(mockStorage.getEmployeesWithFilters).toHaveBeenCalledWith({
        search: 'John'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/employees');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const newEmployee = createTestEmployee();
      const newUser = createTestUser();

      mockStorage.createUser = jest.fn().mockResolvedValue(newUser);
      mockStorage.createEmployee = jest.fn().mockResolvedValue(newEmployee);

      const employeeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@clockpilot.com',
        departmentId: 1,
        hireDate: '2024-01-01',
        contractType: 'CDI',
        weeklyHours: 35
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(employeeData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe('John');
      expect(mockStorage.createUser).toHaveBeenCalled();
      expect(mockStorage.createEmployee).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid employee data');
    });

    it('should require admin role', async () => {
      const employeeToken = createTestJWT(2, 'employee');
      
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(createTestEmployee());

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update an employee', async () => {
      const updatedEmployee = { ...createTestEmployee(), firstName: 'Jane' };
      
      mockStorage.updateEmployee = jest.fn().mockResolvedValue(updatedEmployee);

      const response = await request(app)
        .put('/api/employees/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('Jane');
      expect(mockStorage.updateEmployee).toHaveBeenCalledWith(1, { firstName: 'Jane' });
    });

    it('should return 404 for non-existent employee', async () => {
      mockStorage.updateEmployee = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/employees/999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Employee not found');
    });

    it('should validate employee ID', async () => {
      const response = await request(app)
        .put('/api/employees/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ firstName: 'Jane' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid employee ID');
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should deactivate an employee', async () => {
      const deactivatedEmployee = { ...createTestEmployee(), isActive: false };
      
      mockStorage.updateEmployee = jest.fn().mockResolvedValue(deactivatedEmployee);

      const response = await request(app)
        .delete('/api/employees/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Employee deactivated successfully');
      expect(mockStorage.updateEmployee).toHaveBeenCalledWith(1, { isActive: false });
    });

    it('should return 404 for non-existent employee', async () => {
      mockStorage.updateEmployee = jest.fn().mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/employees/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Employee not found');
    });
  });

  describe('GET /api/employees/stats', () => {
    it('should return employee statistics', async () => {
      const stats = {
        totalEmployees: 50,
        activeEmployees: 45,
        departmentBreakdown: [
          { departmentName: 'IT', count: 20 },
          { departmentName: 'HR', count: 10 }
        ],
        contractTypeBreakdown: [
          { contractType: 'CDI', count: 40 },
          { contractType: 'CDD', count: 10 }
        ]
      };

      mockStorage.getEmployeeStats = jest.fn().mockResolvedValue(stats);

      const response = await request(app)
        .get('/api/employees/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(stats);
      expect(mockStorage.getEmployeeStats).toHaveBeenCalled();
    });

    it('should require admin role', async () => {
      const employeeToken = createTestJWT(2, 'employee');

      const response = await request(app)
        .get('/api/employees/stats')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Employee Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createTestEmployee(),
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid employee data');
    });

    it('should validate contract type', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createTestEmployee(),
          contractType: 'INVALID'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid employee data');
    });

    it('should validate weekly hours range', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...createTestEmployee(),
          weeklyHours: 70 // Dépassement du maximum légal
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid employee data');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockStorage.getEmployeesWithFilters = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch employees');
    });

    it('should handle duplicate email errors', async () => {
      mockStorage.createUser = jest.fn().mockRejectedValue(
        new Error('Email already exists')
      );

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestEmployee());

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create employee');
    });
  });
});