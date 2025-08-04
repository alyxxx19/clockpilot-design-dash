import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { 
  createTestUser, 
  createTestEmployee, 
  createTestPlanningEntry,
  createTestTimeEntry,
  createTestJWT
} from '../tests/setup/backend.setup';

// Mock de la base de données et du storage
jest.mock('./storage');
jest.mock('./db');

describe('Integration Flow Tests', () => {
  let app: express.Express;
  let mockStorage: jest.Mocked<DatabaseStorage>;
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    await registerRoutes(app);
    
    mockStorage = new DatabaseStorage() as jest.Mocked<DatabaseStorage>;
    adminToken = createTestJWT(1, 'admin');
    employeeToken = createTestJWT(2, 'employee');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Planning → Time Entry → Validation Flow', () => {
    it('should handle complete workflow from planning to validation', async () => {
      // 1. Create planning entry
      const planningEntry = createTestPlanningEntry();
      mockStorage.createPlanningEntry = jest.fn().mockResolvedValue(planningEntry);

      const planningResponse = await request(app)
        .post('/api/planning')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: 1,
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60
        });

      expect(planningResponse.status).toBe(201);
      expect(planningResponse.body.id).toBe(1);

      // 2. Employee creates time entry based on planning
      const timeEntry = createTestTimeEntry();
      mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(createTestEmployee());
      mockStorage.createTimeEntry = jest.fn().mockResolvedValue(timeEntry);

      const timeEntryResponse = await request(app)
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:30', // Slight deviation from planning
          breakDuration: 60,
          notes: 'Worked 30 minutes extra to finish task'
        });

      expect(timeEntryResponse.status).toBe(201);
      expect(timeEntryResponse.body.id).toBe('1');

      // 3. Submit time entry for validation
      const submittedEntry = { ...timeEntry, status: 'submitted' };
      mockStorage.updateTimeEntry = jest.fn().mockResolvedValue(submittedEntry);

      const submitResponse = await request(app)
        .post('/api/time-entries/submit')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ entryIds: ['1'] });

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.submitted).toHaveLength(1);

      // 4. Manager validates time entry
      const validatedEntry = { ...timeEntry, status: 'validated', validatedBy: 1 };
      mockStorage.updateTimeEntry = jest.fn().mockResolvedValue(validatedEntry);

      const validationResponse = await request(app)
        .post('/api/time-entries/validate/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          approved: true, 
          comments: 'Approved with overtime noted'
        });

      expect(validationResponse.status).toBe(200);
      expect(validationResponse.body.status).toBe('validated');

      // 5. Generate analytics comparing planned vs actual
      const comparison = {
        plannedHours: 7,
        actualHours: 7.5,
        variance: 0.5,
        efficiency: 107.1
      };
      mockStorage.comparePlannedVsActual = jest.fn().mockResolvedValue(comparison);

      const analyticsResponse = await request(app)
        .get('/api/analytics/planned-vs-actual?employeeId=1&date=2024-08-03')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.variance).toBe(0.5);
    });

    it('should handle planning conflicts during flow', async () => {
      // Create conflicting planning entries
      const conflictResult = {
        generatedEntries: [],
        conflicts: [{
          employeeId: 1,
          date: '2024-08-03',
          message: 'Overlap detected with existing entry'
        }],
        warnings: []
      };

      mockStorage.generatePlanningEntries = jest.fn().mockResolvedValue(conflictResult);

      const response = await request(app)
        .post('/api/planning/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          employeeIds: [1],
          template: 'standard'
        });

      expect(response.status).toBe(200);
      expect(response.body.conflicts).toHaveLength(1);
    });

    it('should handle legal violations during validation', async () => {
      const violationEntry = {
        ...createTestTimeEntry(),
        workedHours: 12,
        legalViolations: ['daily_limit_exceeded']
      };

      mockStorage.updateTimeEntry = jest.fn().mockResolvedValue(violationEntry);

      const response = await request(app)
        .post('/api/time-entries/validate/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          approved: false, 
          comments: 'Rejected due to legal violations'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('rejected');
    });
  });

  describe('Upload → Storage → Delete Workflow', () => {
    it('should handle file upload and processing', async () => {
      // Mock upload service
      const uploadResult = {
        filename: 'timesheet_2024_08.xlsx',
        path: '/uploads/timesheet_2024_08.xlsx',
        size: 15420
      };

      const response = await request(app)
        .post('/api/upload/timesheet')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('mock file content'), 'timesheet.xlsx');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('filename');
    });

    it('should process uploaded timesheet data', async () => {
      const processedData = {
        processedEntries: 25,
        errors: [],
        warnings: [
          { row: 5, message: 'Missing break duration, defaulted to 60 minutes' }
        ]
      };

      mockStorage.processUploadedTimesheet = jest.fn().mockResolvedValue(processedData);

      const response = await request(app)
        .post('/api/process-upload/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.processedEntries).toBe(25);
      expect(response.body.warnings).toHaveLength(1);
    });

    it('should handle file deletion after processing', async () => {
      const response = await request(app)
        .delete('/api/uploads/timesheet_2024_08.xlsx')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('File deleted successfully');
    });
  });

  describe('Notifications Workflow', () => {
    it('should send notifications for planning conflicts', async () => {
      const notification = {
        id: 1,
        userId: 1,
        type: 'planning_conflict',
        title: 'Planning Conflict Detected',
        message: 'Overlap detected in your schedule for August 3rd'
      };

      mockStorage.createNotification = jest.fn().mockResolvedValue(notification);

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 1,
          type: 'planning_conflict',
          title: 'Planning Conflict Detected',
          message: 'Overlap detected in your schedule for August 3rd'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('planning_conflict');
    });

    it('should send notifications for time entry rejections', async () => {
      const notification = {
        id: 2,
        userId: 2,
        type: 'time_entry_rejected',
        title: 'Time Entry Rejected',
        message: 'Your time entry for August 3rd was rejected due to legal violations'
      };

      mockStorage.createNotification = jest.fn().mockResolvedValue(notification);

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 2,
          type: 'time_entry_rejected',
          title: 'Time Entry Rejected',
          message: 'Your time entry for August 3rd was rejected due to legal violations'
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe('time_entry_rejected');
    });

    it('should mark notifications as read', async () => {
      const updatedNotification = {
        id: 1,
        isRead: true,
        readAt: new Date()
      };

      mockStorage.markNotificationAsRead = jest.fn().mockResolvedValue(updatedNotification);

      const response = await request(app)
        .put('/api/notifications/1/read')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.isRead).toBe(true);
    });

    it('should get unread notification count', async () => {
      mockStorage.getUnreadNotificationCount = jest.fn().mockResolvedValue(3);

      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
    });
  });

  describe('Error Recovery and Rollback', () => {
    it('should rollback on failed bulk operations', async () => {
      const bulkResult = {
        successful: [],
        failed: [
          { id: 1, error: 'Legal constraint violation' },
          { id: 2, error: 'Overlap detected' }
        ],
        rollbackPerformed: true
      };

      mockStorage.bulkUpdateTimeEntries = jest.fn().mockResolvedValue(bulkResult);

      const response = await request(app)
        .post('/api/time-entries/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entries: [
            { id: 1, startTime: '06:00', endTime: '20:00' },
            { id: 2, startTime: '12:00', endTime: '16:00' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.rollbackPerformed).toBe(true);
      expect(response.body.failed).toHaveLength(2);
    });

    it('should handle partial success in bulk operations', async () => {
      const bulkResult = {
        successful: [{ id: 1, status: 'updated' }],
        failed: [{ id: 2, error: 'Legal constraint violation' }],
        rollbackPerformed: false
      };

      mockStorage.bulkUpdateTimeEntries = jest.fn().mockResolvedValue(bulkResult);

      const response = await request(app)
        .post('/api/time-entries/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          entries: [
            { id: 1, startTime: '09:00', endTime: '17:00' },
            { id: 2, startTime: '06:00', endTime: '20:00' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.successful).toHaveLength(1);
      expect(response.body.failed).toHaveLength(1);
    });
  });

  describe('Performance and Load Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...createTestTimeEntry(),
        id: `${i + 1}`,
        date: `2024-08-${String((i % 31) + 1).padStart(2, '0')}`
      }));

      mockStorage.getTimeEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: largeDataset.slice(0, 100),
        total: 1000,
        page: 1,
        totalPages: 10
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/time-entries?limit=100&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.entries).toHaveLength(100);
      expect(response.body.total).toBe(1000);
      expect(responseTime).toBeLessThan(1000); // Response under 1 second
    });

    it('should handle concurrent requests properly', async () => {
      mockStorage.getTimeEntriesWithFilters = jest.fn().mockResolvedValue({
        entries: [createTestTimeEntry()],
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Simulate 10 concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/time-entries')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(mockStorage.getTimeEntriesWithFilters).toHaveBeenCalledTimes(10);
    });
  });
});