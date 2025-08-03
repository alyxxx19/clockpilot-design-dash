import { 
  users, employees, projects, tasks, timeEntries, schedules,
  type User, type InsertUser,
  type Employee, type InsertEmployee,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TimeEntry, type InsertTimeEntry,
  type Schedule, type InsertSchedule
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  getAllEmployees(): Promise<Employee[]>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasksByEmployeeId(employeeId: number): Promise<Task[]>;
  getTasksByProjectId(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Time entry methods
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByEmployeeId(employeeId: number): Promise<TimeEntry[]>;
  getTimeEntriesByDateRange(employeeId: number, startDate: string, endDate: string): Promise<TimeEntry[]>;
  createTimeEntry(timeEntry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, timeEntry: Partial<TimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  
  // Schedule methods
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedulesByEmployeeId(employeeId: number): Promise<Schedule[]>;
  getSchedulesByDateRange(employeeId: number, startDate: string, endDate: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<Schedule>): Promise<Schedule | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private employees: Map<number, Employee>;
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private timeEntries: Map<number, TimeEntry>;
  private schedules: Map<number, Schedule>;
  private currentUserId: number;
  private currentEmployeeId: number;
  private currentProjectId: number;
  private currentTaskId: number;
  private currentTimeEntryId: number;
  private currentScheduleId: number;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.projects = new Map();
    this.tasks = new Map();
    this.timeEntries = new Map();
    this.schedules = new Map();
    this.currentUserId = 1;
    this.currentEmployeeId = 1;
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentTimeEntryId = 1;
    this.currentScheduleId = 1;
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create demo admin user
    const adminUser: User = {
      id: 1,
      email: 'demo-admin@clockpilot.com',
      password: 'demo',
      name: 'Admin Demo',
      role: 'admin',
      createdAt: new Date()
    };
    this.users.set(1, adminUser);
    this.currentUserId = 2;

    // Create demo employee user
    const employeeUser: User = {
      id: 2,
      email: 'demo-employee@clockpilot.com',
      password: 'demo',
      name: 'Employé Demo',
      role: 'employee',
      createdAt: new Date()
    };
    this.users.set(2, employeeUser);
    this.currentUserId = 3;

    // Create employee profile
    const employee: Employee = {
      id: 1,
      userId: 2,
      employeeNumber: 'EMP001',
      department: 'Développement',
      position: 'Développeur Full-Stack',
      hourlyRate: '45.00',
      weeklyHours: 40,
      isActive: true
    };
    this.employees.set(1, employee);
    this.currentEmployeeId = 2;

    // Create demo projects
    const project1: Project = {
      id: 1,
      name: 'Site Web E-commerce',
      description: 'Développement d\'une plateforme e-commerce moderne',
      clientName: 'TechCorp',
      isActive: true,
      createdAt: new Date()
    };
    this.projects.set(1, project1);

    const project2: Project = {
      id: 2,
      name: 'Application Mobile',
      description: 'Application mobile pour la gestion de tâches',
      clientName: 'MobileInc',
      isActive: true,
      createdAt: new Date()
    };
    this.projects.set(2, project2);
    this.currentProjectId = 3;

    // Create demo tasks
    const task1: Task = {
      id: 1,
      projectId: 1,
      assignedToId: 2,
      title: 'Développement de l\'interface utilisateur',
      description: 'Créer les composants React pour la page d\'accueil',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: '8.00',
      dueDate: '2025-02-10',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(1, task1);

    const task2: Task = {
      id: 2,
      projectId: 1,
      assignedToId: 2,
      title: 'Intégration de l\'API de paiement',
      description: 'Connecter l\'API Stripe pour les paiements',
      status: 'todo',
      priority: 'medium',
      estimatedHours: '4.00',
      dueDate: '2025-02-15',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(2, task2);
    this.currentTaskId = 3;

    // Create demo time entries
    const timeEntry1: TimeEntry = {
      id: 1,
      employeeId: 2,
      projectId: 1,
      taskId: 1,
      date: '2025-02-03',
      startTime: new Date('2025-02-03T09:00:00'),
      endTime: new Date('2025-02-03T12:00:00'),
      hours: '3.00',
      description: 'Travail sur les composants React',
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.timeEntries.set(1, timeEntry1);

    const timeEntry2: TimeEntry = {
      id: 2,
      employeeId: 2,
      projectId: 1,
      taskId: 1,
      date: '2025-02-03',
      startTime: new Date('2025-02-03T13:00:00'),
      endTime: new Date('2025-02-03T17:00:00'),
      hours: '4.00',
      description: 'Tests et débogage',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.timeEntries.set(2, timeEntry2);
    this.currentTimeEntryId = 3;

    // Create demo schedules
    const schedule1: Schedule = {
      id: 1,
      employeeId: 2,
      date: '2025-02-04',
      startTime: new Date('2025-02-04T09:00:00'),
      endTime: new Date('2025-02-04T17:00:00'),
      breakDuration: 60,
      status: 'confirmed',
      notes: 'Journée de développement normale',
      createdAt: new Date()
    };
    this.schedules.set(1, schedule1);

    const schedule2: Schedule = {
      id: 2,
      employeeId: 2,
      date: '2025-02-05',
      startTime: new Date('2025-02-05T09:00:00'),
      endTime: new Date('2025-02-05T17:00:00'),
      breakDuration: 60,
      status: 'scheduled',
      notes: 'Réunion client prévue à 14h',
      createdAt: new Date()
    };
    this.schedules.set(2, schedule2);
    this.currentScheduleId = 3;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.userId === userId);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentEmployeeId++;
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      employeeNumber: insertEmployee.employeeNumber || null,
      department: insertEmployee.department || null,
      position: insertEmployee.position || null,
      hourlyRate: insertEmployee.hourlyRate || null,
      weeklyHours: insertEmployee.weeklyHours || null,
      isActive: insertEmployee.isActive ?? null
    };
    this.employees.set(id, employee);
    return employee;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(p => p.isActive);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: new Date(),
      description: insertProject.description || null,
      clientName: insertProject.clientName || null,
      isActive: insertProject.isActive ?? null
    };
    this.projects.set(id, project);
    return project;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByEmployeeId(employeeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedToId === employeeId);
  }

  async getTasksByProjectId(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: insertTask.projectId || null,
      assignedToId: insertTask.assignedToId || null,
      description: insertTask.description || null,
      priority: insertTask.priority || null,
      estimatedHours: insertTask.estimatedHours || null,
      dueDate: insertTask.dueDate || null,
      status: insertTask.status || 'todo'
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Time entry methods
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntriesByEmployeeId(employeeId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.employeeId === employeeId);
  }

  async getTimeEntriesByDateRange(employeeId: number, startDate: string, endDate: string): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => 
      entry.employeeId === employeeId && 
      entry.date >= startDate && 
      entry.date <= endDate
    );
  }

  async createTimeEntry(insertTimeEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.currentTimeEntryId++;
    const timeEntry: TimeEntry = { 
      ...insertTimeEntry, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      projectId: insertTimeEntry.projectId || null,
      taskId: insertTimeEntry.taskId || null,
      startTime: insertTimeEntry.startTime || null,
      endTime: insertTimeEntry.endTime || null,
      description: insertTimeEntry.description || null,
      status: insertTimeEntry.status || null
    };
    this.timeEntries.set(id, timeEntry);
    return timeEntry;
  }

  async updateTimeEntry(id: number, updateData: Partial<TimeEntry>): Promise<TimeEntry | undefined> {
    const timeEntry = this.timeEntries.get(id);
    if (!timeEntry) return undefined;
    
    const updatedTimeEntry = { 
      ...timeEntry, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.timeEntries.set(id, updatedTimeEntry);
    return updatedTimeEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  // Schedule methods
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedulesByEmployeeId(employeeId: number): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => schedule.employeeId === employeeId);
  }

  async getSchedulesByDateRange(employeeId: number, startDate: string, endDate: string): Promise<Schedule[]> {
    return Array.from(this.schedules.values()).filter(schedule => 
      schedule.employeeId === employeeId && 
      schedule.date >= startDate && 
      schedule.date <= endDate
    );
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentScheduleId++;
    const schedule: Schedule = { 
      ...insertSchedule, 
      id, 
      createdAt: new Date(),
      breakDuration: insertSchedule.breakDuration || null,
      status: insertSchedule.status || null,
      notes: insertSchedule.notes || null
    };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updateData: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updateData };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  async initializeDemoData(): Promise<void> {
    // Clear existing data
    this.users.clear();
    this.employees.clear();
    this.projects.clear();
    this.tasks.clear();
    this.timeEntries.clear();  
    this.schedules.clear();
    
    // Reset counters
    this.currentUserId = 1;
    this.currentEmployeeId = 1;
    this.currentProjectId = 1;
    this.currentTaskId = 1;
    this.currentTimeEntryId = 1;
    this.currentScheduleId = 1;

    // Create demo users
    const adminUser: User = {
      id: 1,
      email: 'admin@clockpilot.com',
      name: 'Admin Demo',
      role: 'admin',
      password: 'demo123',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, adminUser);
    this.currentUserId = 2;

    const employeeUser: User = {
      id: 2, 
      email: 'employee@clockpilot.com',
      name: 'Employé Demo',
      role: 'employee',
      password: 'demo123',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(2, employeeUser);
    this.currentUserId = 3;

    // Create demo employee
    const demoEmployee: Employee = {
      id: 1,
      userId: 2,
      employeeNumber: 'EMP001',
      department: 'Développement',
      position: 'Développeur Full-Stack',
      hourlyRate: '25.00',
      weeklyHours: 35,
      isActive: true,
      createdAt: new Date()
    };
    this.employees.set(1, demoEmployee);
    this.currentEmployeeId = 2;

    // Create demo projects
    const project1: Project = {
      id: 1,
      name: 'Application Mobile ClockPilot',
      description: 'Développement de l\'application mobile de gestion du temps',
      clientName: 'ClockPilot Inc',
      isActive: true,
      createdAt: new Date()
    };
    this.projects.set(1, project1);

    const project2: Project = {
      id: 2,
      name: 'Plateforme E-commerce',
      description: 'Création d\'une plateforme e-commerce moderne',
      clientName: 'TechCommerce',
      isActive: true, 
      createdAt: new Date()
    };
    this.projects.set(2, project2);
    this.currentProjectId = 3;

    // Create demo tasks
    const task1: Task = {
      id: 1,
      projectId: 1,
      assignedToId: 1,
      title: 'Configuration de l\'environnement de développement',
      description: 'Mettre en place l\'environnement de développement React Native',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: '8',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(1, task1);

    const task2: Task = {
      id: 2,
      projectId: 1,
      assignedToId: 1,
      title: 'Création des interfaces utilisateur',
      description: 'Concevoir et développer les interfaces utilisateur principales',
      status: 'todo',
      priority: 'medium',
      estimatedHours: '16',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(2, task2);

    const task3: Task = {
      id: 3,
      projectId: 2,
      assignedToId: 1,
      title: 'Système de paiement sécurisé',
      description: 'Implémenter le système de paiement avec Stripe',
      status: 'completed',
      priority: 'high', 
      estimatedHours: '12',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(3, task3);

    const task4: Task = {
      id: 4,
      projectId: 2,
      assignedToId: 1,
      title: 'Tests d\'intégration',
      description: 'Écrire et exécuter les tests d\'intégration pour l\'API',
      status: 'todo',
      priority: 'low',
      estimatedHours: '6',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tasks.set(4, task4);
    this.currentTaskId = 5;

    // Create demo time entries
    const timeEntry1: TimeEntry = {
      id: 1,
      employeeId: 1,
      projectId: 1,
      taskId: 1,
      date: new Date().toISOString().split('T')[0],
      duration: '4.5',
      startTime: '09:00',
      endTime: '13:30',
      description: 'Configuration de l\'environnement React Native et outils de développement',
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.timeEntries.set(1, timeEntry1);

    const timeEntry2: TimeEntry = {
      id: 2,
      employeeId: 1,
      projectId: 2,
      taskId: 3,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: '7.5',
      startTime: '08:30',
      endTime: '17:00',
      description: 'Finalisation de l\'intégration Stripe et tests de paiement',
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.timeEntries.set(2, timeEntry2);
    this.currentTimeEntryId = 3;

    // Create demo schedule
    const today = new Date();
    const schedule1: Schedule = {
      id: 1,
      employeeId: 1,
      date: today.toISOString().split('T')[0],
      startTime: '08:30',
      endTime: '17:30',
      breakDuration: '60',
      status: 'confirmed',
      notes: 'Journée de développement sur le projet mobile',
      createdAt: new Date()
    };
    this.schedules.set(1, schedule1);

    // Tomorrow's schedule
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const schedule2: Schedule = {
      id: 2,
      employeeId: 1,
      date: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '18:00',
      breakDuration: '60',
      status: 'pending',
      notes: 'Session de planification et réunion équipe',
      createdAt: new Date()
    };
    this.schedules.set(2, schedule2);
    this.currentScheduleId = 3;
  }
}

export const storage = new MemStorage();
