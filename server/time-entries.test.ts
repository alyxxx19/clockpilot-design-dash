import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { 
  createTestUser, 
  createTestEmployee, 
  createTestTimeEntry,
  createTestJWT,
  createLegalViolationEntry
} from '../tests/setup/backend.setup';

// Mock de la base de données et du storage
jest.mock('./storage');
jest.mock('./db');

describe('Time Entries API Tests with Validation', () => {
  let app: express.Express;
  let mockStorage: jest.Mocked<DatabaseStorage>;
  let authToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    
    mockStorage = new DatabaseStorage() as jest.Mocked<DatabaseStorage>;
    authToken = createTestJWT(1, 'employee');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/time-entries', () => {
    it('should fetch time entries with filters', async () => {
      const testEntries = [createTestTimeEntry()];

      mockStorage.getTimeEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: testEntries,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/time-entries?dateFrom=2024-08-01&dateTo=2024-08-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(1);
      expect(mockStorage.getTimeEntriesWithFilters).toHaveBeenCalledWith({
        dateFrom: '2024-08-01',
        dateTo: '2024-08-31'
      });
    });

    it('should filter by employee ID', async () => {
      const testEntries = [createTestTimeEntry()];

      mockStorage.getTimeEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: testEntries,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/time-entries?employeeIds=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(mockStorage.getTimeEntriesWithFilters).toHaveBeenCalledWith({
        employeeIds: [1]
      });
    });

    it('should filter by status', async () => {
      const testEntries = [createTestTimeEntry()];

      mockStorage.getTimeEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: testEntries,
        total: 1,
        page: 1,
        totalPages: 1
      });

      const response = await request(app)
        .get('/api/time-entries?status=validated')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(mockStorage.getTimeEntriesWithFilters).toHaveBeenCalledWith({
        status: 'validated'
      });
    });
  });

  describe('POST /api/time-entries', () => {
    it('should create a new time entry with validation', async () => {
      const newEntry = createTestTimeEntry();
      
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.createTimeEntry = jest.fn().mockResolvedValue(newEntry);

      const entryData = {
        date: '2024-08-03',
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 60,
        notes: 'Regular work day'
      };

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entryData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(mockStorage.createTimeEntry).toHaveBeenCalled();
    });

    it('should validate daily working time limits (10 hours max)', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '06:00',
          endTime: '20:00', // 14 heures
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceeds daily limit');
    });

    it('should validate weekly working time limits (48 hours max)', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.getWeeklyWorkedHours = jest.fn().mockResolvedValue(45);

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '14:00', // 5 heures qui dépasseraient la limite
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('exceeds weekly limit');
    });

    it('should validate minimum rest period (11 hours)', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.getLastWorkEndTime = jest.fn().mockResolvedValue('22:00');

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-04',
          startTime: '07:00', // Seulement 9 heures de repos
          endTime: '15:00',
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('insufficient rest period');
    });

    it('should detect time overlap conflicts', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.checkTimeOverlap = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('time overlap');
    });

    it('should validate break duration reasonableness', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 300 // 5 heures de pause - déraisonnable
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('break duration');
    });
  });

  describe('PUT /api/time-entries/:id', () => {
    it('should update time entry with validation', async () => {
      const updatedEntry = { ...createTestTimeEntry(), endTime: '18:00' };
      
      mockStorage.updateTimeEntry = jest.fn().mockResolvedValue(updatedEntry);

      const response = await request(app)
        .put('/api/time-entries/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ endTime: '18:00' });

      expect(response.status).toBe(200);
      expect(response.body.endTime).toBe('18:00');
    });

    it('should reject updates that violate legal constraints', async () => {
      const response = await request(app)
        .put('/api/time-entries/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          startTime: '06:00',
          endTime: '21:00' // 15 heures - violation
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('legal constraint');
    });

    it('should prevent updates to validated entries', async () => {
      const validatedEntry = { ...createTestTimeEntry(), status: 'validated' };
      mockStorage.getTimeEntry = jest.fn().mockResolvedValue(validatedEntry);

      const response = await request(app)
        .put('/api/time-entries/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ endTime: '18:00' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('validated entry');
    });
  });

  describe('POST /api/time-entries/bulk-submit', () => {
    it('should submit multiple time entries with validation', async () => {
      const bulkEntries = [
        { ...createTestTimeEntry(), id: '1', date: '2024-08-01' },
        { ...createTestTimeEntry(), id: '2', date: '2024-08-02' }
      ];

      mockStorage.bulkUpdateTimeEntries = jest.fn().mockResolvedValue({
        updated: bulkEntries,
        conflicts: [],
        violations: []
      });

      const response = await request(app)
        .post('/api/time-entries/bulk-submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryIds: ['1', '2'] });

      expect(response.status).toBe(200);
      expect(response.body.updated).toHaveLength(2);
      expect(response.body.conflicts).toHaveLength(0);
    });

    it('should detect anomalies in bulk submission', async () => {
      const anomalies = [
        {
          entryId: '1',
          type: 'missing_break',
          message: 'No break recorded for 8+ hour day'
        },
        {
          entryId: '2',
          type: 'unauthorized_overtime',
          message: 'Overtime without prior approval'
        }
      ];

      mockStorage.bulkUpdateTimeEntries = jest.fn().mockResolvedValue({
        updated: [],
        conflicts: [],
        violations: [],
        anomalies
      });

      const response = await request(app)
        .post('/api/time-entries/bulk-submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ entryIds: ['1', '2'] });

      expect(response.status).toBe(200);
      expect(response.body.anomalies).toHaveLength(2);
      expect(response.body.anomalies[0].type).toBe('missing_break');
    });
  });

  describe('POST /api/time-entries/validate/:id', () => {
    it('should validate time entry by manager', async () => {
      const managerToken = createTestJWT(2, 'admin');
      const validatedEntry = { ...createTestTimeEntry(), status: 'validated', validatedBy: 2 };
      
      mockStorage.updateTimeEntry = jest.fn().mockResolvedValue(validatedEntry);

      const response = await request(app)
        .post('/api/time-entries/validate/1')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approved: true, comments: 'Approved' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('validated');
    });

    it('should reject validation by non-manager', async () => {
      const response = await request(app)
        .post('/api/time-entries/validate/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ approved: true });

      expect(response.status).toBe(403);
    });
  });

  describe('Overtime Calculation Tests', () => {
    it('should calculate daily overtime correctly', async () => {
      const overtimeEntry = {
        ...createTestTimeEntry(),
        startTime: '08:00',
        endTime: '19:00', // 11 heures
        breakDuration: 60 // 10 heures travaillées = 0 heures sup quotidiennes car limite = 10h
      };

      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.createTimeEntry = jest.fn().mockResolvedValue({
        ...overtimeEntry,
        workedHours: 10,
        overtimeHours: 0
      });

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '08:00',
          endTime: '19:00',
          breakDuration: 60
        });

      expect(response.status).toBe(201);
      expect(response.body.workedHours).toBe(10);
      expect(response.body.overtimeHours).toBe(0);
    });

    it('should calculate weekly overtime correctly', async () => {
      const response = await request(app)
        .get('/api/time-entries/overtime-summary?employeeId=1&week=2024-W31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weeklyHours');
      expect(response.body).toHaveProperty('overtimeHours');
    });
  });

  describe('Anomaly Detection Tests', () => {
    it('should detect missing breaks for long days', async () => {
      const response = await request(app)
        .get('/api/time-entries/anomalies?dateFrom=2024-08-01&dateTo=2024-08-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('anomalies');
    });

    it('should detect unusual work patterns', async () => {
      const anomalies = [
        {
          employeeId: 1,
          type: 'weekend_work',
          date: '2024-08-04',
          message: 'Work recorded on weekend without authorization'
        },
        {
          employeeId: 1,
          type: 'late_night_work',
          date: '2024-08-03',
          message: 'Work recorded after 22:00'
        }
      ];

      mockStorage.detectWorkPatternAnomalies = jest.fn().mockResolvedValue(anomalies);

      const response = await request(app)
        .get('/api/time-entries/anomalies?type=pattern&employeeId=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.anomalies).toHaveLength(2);
    });
  });

  describe('Planning vs Actual Analysis', () => {
    it('should compare planned vs actual hours', async () => {
      const comparison = {
        totalPlannedHours: 35,
        totalActualHours: 38,
        variance: 3,
        entries: [
          {
            date: '2024-08-03',
            plannedHours: 7,
            actualHours: 8,
            variance: 1
          }
        ]
      };

      mockStorage.comparePlannedVsActual = jest.fn().mockResolvedValue(comparison);

      const response = await request(app)
        .get('/api/time-entries/vs-planning?employeeId=1&week=2024-W31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.variance).toBe(3);
      expect(response.body.entries).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockStorage.getTimeEntriesWithFilters = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch time entries');
    });

    it('should validate time format', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-08-03',
          startTime: '25:00', // Invalid time
          endTime: '17:00',
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid time entry data');
    });

    it('should validate date format', async () => {
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());

      const response = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: 'invalid-date',
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid time entry data');
    });
  });
});