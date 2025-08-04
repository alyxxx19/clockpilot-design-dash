import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { 
  createTestUser, 
  createTestEmployee, 
  createTestPlanningEntry,
  createTestJWT,
  createConflictingEntries,
  createLegalViolationEntry
} from '../tests/setup/backend.setup';

// Mock de la base de données et du storage
jest.mock('./storage');
jest.mock('./db');

describe('Planning API Tests with Legal Constraints', () => {
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

  describe('GET /api/planning', () => {
    it('should fetch planning entries with filters', async () => {
      const testEntries = [createTestPlanningEntry()];

      mockStorage.getPlanningEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: testEntries,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/planning?dateFrom=2024-08-01&dateTo=2024-08-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(mockStorage.getPlanningEntriesWithFilters).toHaveBeenCalledWith({
        dateFrom: '2024-08-01',
        dateTo: '2024-08-31'
      });
    });

    it('should filter by employee ID', async () => {
      const testEntries = [createTestPlanningEntry()];

      mockStorage.getPlanningEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: testEntries,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/planning?employeeIds=1,2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(mockStorage.getPlanningEntriesWithFilters).toHaveBeenCalledWith({
        employeeIds: [1, 2]
      });
    });
  });

  describe('POST /api/planning/generate', () => {
    it('should generate planning with legal constraints validation', async () => {
      const generatedPlanning = {
        generatedEntries: [createTestPlanningEntry()],
        conflicts: [],
        warnings: []
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(generatedPlanning);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'standard'
        });

      expect(response.status).toBe(200);
      expect(response.body.generatedEntries).toHaveLength(1);
      expect(response.body.conflicts).toHaveLength(0);
      expect(mockStorage.generatePlanningEntries).toHaveBeenCalled();
    });

    it('should detect and report conflicts in generated planning', async () => {
      const conflictingEntries = createConflictingEntries();
      const generatedPlanning = {
        generatedEntries: conflictingEntries,
        conflicts: [{
          employeeId: 1,
          date: '2024-08-03',
          conflictingEntries: [conflictingEntries[0], conflictingEntries[1]],
          message: 'Overlap detected between 12:00 and 13:00'
        }],
        warnings: []
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(generatedPlanning);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'intensive'
        });

      expect(response.status).toBe(200);
      expect(response.body.conflicts).toHaveLength(1);
      expect(response.body.conflicts[0].message).toContain('Overlap detected');
    });

    it('should enforce French legal constraints - daily limits', async () => {
      const violationEntry = createLegalViolationEntry();
      const generatedPlanning = {
        generatedEntries: [violationEntry],
        conflicts: [],
        warnings: [{
          employeeId: 1,
          date: '2024-08-03',
          type: 'daily_limit_exceeded',
          message: 'Daily working time exceeds 10 hours legal limit',
          plannedHours: 13
        }]
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(generatedPlanning);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'intensive'
        });

      expect(response.status).toBe(200);
      expect(response.body.warnings).toHaveLength(1);
      expect(response.body.warnings[0].type).toBe('daily_limit_exceeded');
    });

    it('should enforce French legal constraints - weekly limits', async () => {
      const generatedPlanning = {
        generatedEntries: [],
        conflicts: [],
        warnings: [{
          employeeId: 1,
          week: '2024-W31',
          type: 'weekly_limit_exceeded',
          message: 'Weekly working time exceeds 48 hours legal limit',
          plannedHours: 52
        }]
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(generatedPlanning);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'intensive'
        });

      expect(response.status).toBe(200);
      expect(response.body.warnings).toHaveLength(1);
      expect(response.body.warnings[0].type).toBe('weekly_limit_exceeded');
    });

    it('should enforce rest period constraints', async () => {
      const generatedPlanning = {
        generatedEntries: [],
        conflicts: [],
        warnings: [{
          employeeId: 1,
          date: '2024-08-03',
          type: 'insufficient_rest',
          message: 'Insufficient rest period between shifts (minimum 11 hours required)',
          restHours: 8
        }]
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(generatedPlanning);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'night_shift'
        });

      expect(response.status).toBe(200);
      expect(response.body.warnings).toHaveLength(1);
      expect(response.body.warnings[0].type).toBe('insufficient_rest');
    });
  });

  describe('PUT /api/planning/:id', () => {
    it('should update planning entry with validation', async () => {
      const updatedEntry = { ...createTestPlanningEntry(), startTime: '10:00' };
      
      mockStorage.updatePlanningEntry = jest.fn().mockResolvedValue(updatedEntry);

      const response = await request(app)
        .put('/api/planning/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ startTime: '10:00' });

      expect(response.status).toBe(200);
      expect(response.body.startTime).toBe('10:00');
      expect(mockStorage.updatePlanningEntry).toHaveBeenCalledWith(1, { startTime: '10:00' });
    });

    it('should reject updates that violate legal constraints', async () => {
      const response = await request(app)
        .put('/api/planning/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          startTime: '06:00',
          endTime: '20:00' // 14 heures - violation
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('legal constraint');
    });
  });

  describe('POST /api/planning/bulk-update', () => {
    it('should perform bulk updates with validation', async () => {
      const bulkUpdates = [
        { id: 1, startTime: '09:00', endTime: '17:00' },
        { id: 2, startTime: '08:00', endTime: '16:00' }
      ];

      mockStorage.bulkUpdatePlanningEntries = jest.fn().mockResolvedValue({
        updated: bulkUpdates,
        conflicts: [],
        warnings: []
      });

      const response = await request(app)
        .post('/api/planning/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entries: bulkUpdates });

      expect(response.status).toBe(200);
      expect(response.body.updated).toHaveLength(2);
      expect(response.body.conflicts).toHaveLength(0);
    });

    it('should detect conflicts in bulk updates', async () => {
      const bulkUpdates = createConflictingEntries();

      mockStorage.bulkUpdatePlanningEntries = jest.fn().mockResolvedValue({
        updated: [],
        conflicts: [{
          employeeId: 1,
          date: '2024-08-03',
          conflictingEntries: bulkUpdates,
          message: 'Overlap detected in bulk update'
        }],
        warnings: []
      });

      const response = await request(app)
        .post('/api/planning/bulk-update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entries: bulkUpdates });

      expect(response.status).toBe(200);
      expect(response.body.conflicts).toHaveLength(1);
      expect(response.body.updated).toHaveLength(0);
    });
  });

  describe('POST /api/planning/validate', () => {
    it('should validate planning entries against legal constraints', async () => {
      const validationResult = {
        isValid: false,
        violations: [
          {
            employeeId: 1,
            date: '2024-08-03',
            type: 'daily_limit_exceeded',
            message: 'Daily working time exceeds 10 hours',
            plannedHours: 12
          }
        ],
        warnings: [
          {
            employeeId: 1,
            date: '2024-08-04',
            type: 'approaching_weekly_limit',
            message: 'Approaching weekly limit (45/48 hours)',
            plannedHours: 45
          }
        ]
      };

      mockStorage.validatePlanningEntries = jest.fn().mockResolvedValue(validationResult);

      const response = await request(app)
        .post('/api/planning/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateFrom: '2024-08-01',
          dateTo: '2024-08-31',
          employeeIds: [1]
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(false);
      expect(response.body.violations).toHaveLength(1);
      expect(response.body.warnings).toHaveLength(1);
    });

    it('should return valid for compliant planning', async () => {
      const validationResult = {
        isValid: true,
        violations: [],
        warnings: []
      };

      mockStorage.validatePlanningEntries = jest.fn().mockResolvedValue(validationResult);

      const response = await request(app)
        .post('/api/planning/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          dateFrom: '2024-08-01',
          dateTo: '2024-08-31',
          employeeIds: [1]
        });

      expect(response.status).toBe(200);
      expect(response.body.isValid).toBe(true);
      expect(response.body.violations).toHaveLength(0);
    });
  });

  describe('Legal Constraint Validation', () => {
    it('should enforce maximum 10 hours per day', async () => {
      const response = await request(app)
        .post('/api/planning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId: 1,
          date: '2024-08-03',
          startTime: '06:00',
          endTime: '17:00', // 11 heures
          breakDuration: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceeds daily limit');
    });

    it('should enforce maximum 48 hours per week', async () => {
      // Mock une semaine déjà chargée
      mockStorage.getWeeklyHours = jest.fn().mockResolvedValue(45);

      const response = await request(app)
        .post('/api/planning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId: 1,
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '14:00', // 5 heures qui dépasseraient la limite
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceeds weekly limit');
    });

    it('should enforce minimum 11-hour rest period', async () => {
      // Mock une entrée précédente qui se termine tard
      mockStorage.getLastWorkEnd = jest.fn().mockResolvedValue('22:00');

      const response = await request(app)
        .post('/api/planning')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          employeeId: 1,
          date: '2024-08-04',
          startTime: '07:00', // Seulement 9 heures de repos
          endTime: '15:00',
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('insufficient rest period');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in planning generation', async () => {
      mockStorage.generatePlanningEntries = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1]
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to generate planning');
    });

    it('should validate date formats', async () => {
      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: 'invalid-date',
          endDate: '2024-08-31',
          employeeIds: [1]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid planning data');
    });
  });
});