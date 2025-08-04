import request from 'supertest';
import express from 'express';
import { registerRoutes } from './routes';
import { DatabaseStorage } from './storage';
import { 
  createTestUser, 
  createTestEmployee, 
  createTestProject,
  createTestTask,
  createTestJWT
} from '../tests/setup/backend.setup';

// Mock de la base de données et du storage
jest.mock('./storage');
jest.mock('./db');

describe('Projects and Tasks API Tests', () => {
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

  describe('Projects API', () => {
    describe('GET /api/projects', () => {
      it('should fetch projects with stats and pagination', async () => {
        const testProjects = [
          {
            ...createTestProject(),
            tasks_count: 5,
            active_tasks: 3,
            members_count: 4
          }
        ];

        mockStorage.getProjectsWithStats = jest.fn().mockResolvedValue({
          projects: testProjects,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/projects?page=1&limit=10')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.projects).toHaveLength(1);
        expect(response.body.projects[0].tasks_count).toBe(5);
        expect(response.body.projects[0].active_tasks).toBe(3);
      });

      it('should filter projects by status', async () => {
        const testProjects = [createTestProject()];

        mockStorage.getProjectsWithStats = jest.fn().mockResolvedValue({
          projects: testProjects,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/projects?status=active')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getProjectsWithStats).toHaveBeenCalledWith({
          status: 'active'
        });
      });

      it('should search projects by name or client', async () => {
        const testProjects = [createTestProject()];

        mockStorage.getProjectsWithStats = jest.fn().mockResolvedValue({
          projects: testProjects,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/projects?search=Test')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getProjectsWithStats).toHaveBeenCalledWith({
          search: 'Test'
        });
      });
    });

    describe('POST /api/projects', () => {
      it('should create a new project', async () => {
        const newProject = createTestProject();
        
        mockStorage.createProject = jest.fn().mockResolvedValue(newProject);

        const projectData = {
          name: 'New Project',
          description: 'A new project for testing',
          client_name: 'Test Client',
          status: 'active',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          budget: '50000.00',
          hourly_rate: '100.00'
        };

        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(projectData);

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Test Project');
        expect(mockStorage.createProject).toHaveBeenCalled();
      });

      it('should require admin role for project creation', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send(createTestProject());

        expect(response.status).toBe(403);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Incomplete Project'
            // Missing required fields
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid project data');
      });
    });

    describe('PUT /api/projects/:id', () => {
      it('should update a project', async () => {
        const updatedProject = { ...createTestProject(), status: 'completed' };
        
        mockStorage.updateProject = jest.fn().mockResolvedValue(updatedProject);

        const response = await request(app)
          .put('/api/projects/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'completed' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('completed');
        expect(mockStorage.updateProject).toHaveBeenCalledWith(1, { status: 'completed' });
      });

      it('should return 404 for non-existent project', async () => {
        mockStorage.updateProject = jest.fn().mockResolvedValue(undefined);

        const response = await request(app)
          .put('/api/projects/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'completed' });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Project not found');
      });
    });

    describe('Project Members Management', () => {
      it('should get project members', async () => {
        const members = [
          {
            id: 1,
            employee_id: 1,
            employee_name: 'John Doe',
            employee_email: 'john@clockpilot.com',
            role: 'developer',
            hourly_rate: '75.00'
          }
        ];

        mockStorage.getProjectMembers = jest.fn().mockResolvedValue(members);

        const response = await request(app)
          .get('/api/projects/1/members')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].employee_name).toBe('John Doe');
      });

      it('should assign member to project', async () => {
        const newMember = {
          id: 1,
          project_id: 1,
          employee_id: 2,
          role: 'developer',
          hourly_rate: '75.00'
        };

        mockStorage.assignProjectMember = jest.fn().mockResolvedValue(newMember);

        const response = await request(app)
          .post('/api/projects/1/assign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employee_id: 2,
            role: 'developer',
            hourly_rate: 75.00
          });

        expect(response.status).toBe(201);
        expect(response.body.employee_id).toBe(2);
      });
    });
  });

  describe('Tasks API', () => {
    describe('GET /api/tasks', () => {
      it('should fetch tasks with filtering', async () => {
        const testTasks = [
          {
            ...createTestTask(),
            project_name: 'Test Project',
            assignee_name: 'John Doe'
          }
        ];

        mockStorage.getTasksWithFilters = jest.fn().mockResolvedValue({
          tasks: testTasks,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/tasks?project_id=1&status=todo')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(1);
        expect(response.body.tasks[0].project_name).toBe('Test Project');
      });

      it('should filter tasks by priority', async () => {
        const testTasks = [createTestTask()];

        mockStorage.getTasksWithFilters = jest.fn().mockResolvedValue({
          tasks: testTasks,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/tasks?priority=high')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getTasksWithFilters).toHaveBeenCalledWith({
          priority: 'high'
        });
      });

      it('should filter tasks by due date range', async () => {
        const testTasks = [createTestTask()];

        mockStorage.getTasksWithFilters = jest.fn().mockResolvedValue({
          tasks: testTasks,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/tasks?due_date_from=2024-08-01&due_date_to=2024-08-31')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getTasksWithFilters).toHaveBeenCalledWith({
          due_date_from: '2024-08-01',
          due_date_to: '2024-08-31'
        });
      });

      it('should search tasks by title and description', async () => {
        const testTasks = [createTestTask()];

        mockStorage.getTasksWithFilters = jest.fn().mockResolvedValue({
          tasks: testTasks,
          total: 1,
          page: 1,
          totalPages: 1
        });

        const response = await request(app)
          .get('/api/tasks?search=test')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getTasksWithFilters).toHaveBeenCalledWith({
          search: 'test'
        });
      });
    });

    describe('POST /api/tasks', () => {
      it('should create a new task', async () => {
        const newTask = createTestTask();
        
        mockStorage.createTaskApi = jest.fn().mockResolvedValue(newTask);

        const taskData = {
          title: 'New Task',
          description: 'A new task for testing',
          project_id: 1,
          assigned_to: 2,
          status: 'todo',
          priority: 'medium',
          due_date: '2024-08-10',
          estimated_hours: '8.0',
          tags: ['frontend', 'testing']
        };

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(taskData);

        expect(response.status).toBe(201);
        expect(response.body.title).toBe('Test Task');
        expect(mockStorage.createTaskApi).toHaveBeenCalled();
      });

      it('should allow employees to create tasks', async () => {
        const newTask = createTestTask();
        
        mockStorage.createTaskApi = jest.fn().mockResolvedValue(newTask);

        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send(createTestTask());

        expect(response.status).toBe(201);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Incomplete Task'
            // Missing required fields
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid task data');
      });
    });

    describe('PUT /api/tasks/:id', () => {
      it('should update a task', async () => {
        const updatedTask = { ...createTestTask(), status: 'in_progress' };
        
        mockStorage.updateTaskApi = jest.fn().mockResolvedValue(updatedTask);

        const response = await request(app)
          .put('/api/tasks/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'in_progress' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('in_progress');
        expect(mockStorage.updateTaskApi).toHaveBeenCalledWith(1, { status: 'in_progress' });
      });

      it('should return 404 for non-existent task', async () => {
        mockStorage.updateTaskApi = jest.fn().mockResolvedValue(undefined);

        const response = await request(app)
          .put('/api/tasks/999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'completed' });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Task not found');
      });
    });

    describe('PUT /api/tasks/:id/status', () => {
      it('should update task status with progress', async () => {
        const updatedTask = { 
          ...createTestTask(), 
          status: 'in_progress',
          completion_percentage: 50,
          actual_hours: '4.0'
        };
        
        mockStorage.updateTaskStatus = jest.fn().mockResolvedValue(updatedTask);

        const response = await request(app)
          .put('/api/tasks/1/status')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({ 
            status: 'in_progress',
            completion_percentage: 50,
            actual_hours: 4.0
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('in_progress');
        expect(response.body.completion_percentage).toBe(50);
      });

      it('should complete task with final hours', async () => {
        const completedTask = { 
          ...createTestTask(), 
          status: 'completed',
          completion_percentage: 100,
          actual_hours: '7.5'
        };
        
        mockStorage.updateTaskStatus = jest.fn().mockResolvedValue(completedTask);

        const response = await request(app)
          .put('/api/tasks/1/status')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({ 
            status: 'completed',
            completion_percentage: 100,
            actual_hours: 7.5
          });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('completed');
        expect(response.body.completion_percentage).toBe(100);
      });
    });

    describe('GET /api/tasks/my', () => {
      it('should get current user\'s tasks', async () => {
        const employee = createTestEmployee();
        const myTasks = [createTestTask()];

        mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(employee);
        mockStorage.getTasksByEmployeeId = jest.fn().mockResolvedValue({
          tasks: myTasks,
          total: 1
        });

        const response = await request(app)
          .get('/api/tasks/my')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.tasks).toHaveLength(1);
        expect(mockStorage.getTasksByEmployeeId).toHaveBeenCalledWith(1, {});
      });

      it('should filter my tasks by status', async () => {
        const employee = createTestEmployee();
        const myTasks = [createTestTask()];

        mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(employee);
        mockStorage.getTasksByEmployeeId = jest.fn().mockResolvedValue({
          tasks: myTasks,
          total: 1
        });

        const response = await request(app)
          .get('/api/tasks/my?status=in_progress')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(200);
        expect(mockStorage.getTasksByEmployeeId).toHaveBeenCalledWith(1, {
          status: 'in_progress'
        });
      });
    });
  });

  describe('Dashboard API', () => {
    describe('GET /api/dashboard/admin', () => {
      it('should return admin dashboard data', async () => {
        const dashboardData = {
          stats: {
            total_employees: 50,
            active_projects: 12,
            active_tasks: 85
          },
          charts: {
            projects_by_status: [
              { status: 'active', count: 12 },
              { status: 'completed', count: 8 }
            ],
            tasks_by_priority: [
              { priority: 'high', count: 15 },
              { priority: 'medium', count: 35 }
            ]
          }
        };

        mockStorage.getAdminDashboardData = jest.fn().mockResolvedValue(dashboardData);

        const response = await request(app)
          .get('/api/dashboard/admin')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.stats.total_employees).toBe(50);
        expect(response.body.charts.projects_by_status).toHaveLength(2);
      });

      it('should require admin role', async () => {
        const response = await request(app)
          .get('/api/dashboard/admin')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/dashboard/employee', () => {
      it('should return employee dashboard data', async () => {
        const employee = createTestEmployee();
        const dashboardData = {
          my_tasks: [
            { status: 'todo', count: 5 },
            { status: 'in_progress', count: 3 }
          ],
          my_projects: [
            { id: 1, name: 'Project A', status: 'active', tasks_count: 8 }
          ],
          recent_time_entries: [
            { date: '2024-08-03', total_hours: 8 }
          ]
        };

        mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(employee);
        mockStorage.getEmployeeDashboardData = jest.fn().mockResolvedValue(dashboardData);

        const response = await request(app)
          .get('/api/dashboard/employee')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(200);
        expect(response.body.my_tasks).toHaveLength(2);
        expect(response.body.my_projects).toHaveLength(1);
      });

      it('should return 404 if employee profile not found', async () => {
        mockStorage.getEmployeeByUserId = jest.fn().mockResolvedValue(undefined);

        const response = await request(app)
          .get('/api/dashboard/employee')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Employee profile not found');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in projects API', async () => {
      mockStorage.getProjectsWithStats = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch projects');
    });

    it('should handle database errors in tasks API', async () => {
      mockStorage.getTasksWithFilters = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch tasks');
    });

    it('should validate project ID format', async () => {
      const response = await request(app)
        .put('/api/projects/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid project ID');
    });

    it('should validate task ID format', async () => {
      const response = await request(app)
        .put('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid task ID');
    });
  });
});