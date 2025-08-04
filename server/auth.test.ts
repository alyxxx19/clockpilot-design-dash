import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { createTestUser } from '../tests/setup/backend.setup';

// Mock de la base de données
jest.mock('./storage');
jest.mock('./db');

describe('Authentication API', () => {
  let app: express.Application;
  let mockStorage: jest.Mocked<DatabaseStorage>;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    
    mockStorage = new DatabaseStorage() as jest.Mocked<DatabaseStorage>;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const testUser = createTestUser();
      const hashedPassword = await bcrypt.hash('password123', 4);
      
      mockStorage.getUserByEmail = jest.fn().mockResolvedValue({
        ...testUser,
        hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@clockpilot.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@clockpilot.com');
      expect(response.body.user).not.toHaveProperty('hashedPassword');
    });

    it('should reject invalid email', async () => {
      mockStorage.getUserByEmail = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@clockpilot.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const testUser = createTestUser();
      const hashedPassword = await bcrypt.hash('password123', 4);
      
      mockStorage.getUserByEmail = jest.fn().mockResolvedValue({
        ...testUser,
        hashedPassword
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@clockpilot.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should require password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@clockpilot.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh valid token', async () => {
      const testUser = createTestUser();
      const token = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockStorage.getUserById = jest.fn().mockResolvedValue(testUser);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token); // Le token doit être différent
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired token', async () => {
      const testUser = createTestUser();
      const expiredToken = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Token expiré
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject missing authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('NO_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const testUser = createTestUser();
      const token = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should accept logout even with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('Middleware Protection', () => {
    it('should protect routes requiring authentication', async () => {
      const response = await request(app)
        .get('/api/employees');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should allow access with valid token', async () => {
      const testUser = createTestUser();
      const token = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockStorage.getUserById = jest.fn().mockResolvedValue(testUser);
      mockStorage.getEmployeesWithPagination = jest.fn().mockResolvedValue({
        employees: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(401);
    });
  });

  describe('Role Authorization', () => {
    it('should allow admin access to admin routes', async () => {
      const adminUser = { ...createTestUser(), role: 'admin' as const };
      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockStorage.getUserById = jest.fn().mockResolvedValue(adminUser);
      mockStorage.getEmployeesWithPagination = jest.fn().mockResolvedValue({
        employees: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(403);
    });

    it('should deny employee access to admin routes', async () => {
      const employeeUser = { ...createTestUser(), role: 'employee' as const };
      const token = jwt.sign(
        { id: employeeUser.id, email: employeeUser.email, role: employeeUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      mockStorage.getUserById = jest.fn().mockResolvedValue(employeeUser);

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});