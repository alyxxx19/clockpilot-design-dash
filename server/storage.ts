import { 
  users, 
  employees,
  departments,
  projects,
  projectAssignments,
  planningEntries,
  timeEntries,
  tasks,
  settings,
  validations,
  type User, 
  type InsertUser,
  type Employee,
  type InsertEmployee,
  type Department,
  type InsertDepartment,
  type Project,
  type InsertProject,
  type PlanningEntry,
  type InsertPlanningEntry,
  type TimeEntry,
  type InsertTimeEntry,
  type Task,
  type InsertTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, like, or } from "drizzle-orm";

// ============================================================================
// STORAGE INTERFACE - Define all CRUD operations needed by the application
// ============================================================================
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByUserId(userId: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  getEmployeesByDepartment(departmentId: number): Promise<Employee[]>;
  getEmployeesByManager(managerId: number): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // Advanced employee queries
  getEmployeesWithPagination(
    page: number, 
    limit: number, 
    filters?: { 
      search?: string; 
      department?: number; 
      status?: string; 
      sortBy?: string; 
      sortOrder?: string; 
    }
  ): Promise<{ employees: any[]; total: number; page: number; totalPages: number; }>;
  getEmployeeWithDetails(id: number): Promise<any>;
  getEmployeeStats(id: number): Promise<any>;
  softDeleteEmployee(id: number): Promise<Employee | undefined>;

  // Planning operations
  getPlanningEntries(
    startDate: string,
    endDate: string,
    employeeId?: number,
    departmentId?: number
  ): Promise<any[]>;
  getEmployeeWeeklyPlanning(employeeId: number, weekStart: string): Promise<any>;
  createPlanningEntry(entry: InsertPlanningEntry): Promise<PlanningEntry>;
  updatePlanningEntry(id: number, entry: Partial<InsertPlanningEntry>): Promise<PlanningEntry | undefined>;
  deletePlanningEntry(id: number): Promise<boolean>;
  bulkCreatePlanningEntries(entries: InsertPlanningEntry[]): Promise<PlanningEntry[]>;
  bulkUpdatePlanningEntries(entries: { id: number; data: Partial<InsertPlanningEntry> }[]): Promise<PlanningEntry[]>;
  
  // Planning validation
  createValidation(validation: InsertValidation): Promise<Validation>;
  getValidationByEmployeeAndWeek(employeeId: number, weekStart: string): Promise<Validation | undefined>;
  
  // Planning conflicts and validation logic
  detectPlanningConflicts(employeeId?: number, startDate?: string, endDate?: string): Promise<any[]>;
  validateDailyHours(employeeId: number, date: string, startTime: string, endTime: string): Promise<{ valid: boolean; hours: number; conflicts: string[] }>;
  validateWeeklyHours(employeeId: number, weekStart: string): Promise<{ valid: boolean; totalHours: number; conflicts: string[] }>;
  validateRestPeriod(employeeId: number, date: string, startTime: string): Promise<{ valid: boolean; conflicts: string[] }>;
  
  // Planning generation
  generatePlanningForPeriod(
    startDate: string,
    endDate: string,
    employeeIds?: number[],
    departmentId?: number,
    templateId?: number
  ): Promise<PlanningEntry[]>;

  // Time entries operations
  getTimeEntries(
    employeeId?: number,
    dateFrom?: string,
    dateTo?: string,
    status?: string,
    page?: number,
    limit?: number
  ): Promise<{ entries: any[]; total: number; page: number; totalPages: number }>;
  getTimeEntriesByEmployee(employeeId: number, date?: string): Promise<any[]>;
  getCurrentDayTimeEntries(employeeId: number): Promise<any[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  bulkCreateTimeEntries(entries: InsertTimeEntry[]): Promise<TimeEntry[]>;
  bulkUpdateTimeEntries(entries: { id: number; data: Partial<InsertTimeEntry> }[]): Promise<TimeEntry[]>;
  
  // Time entry validation and business logic
  validateTimeEntryOverlap(employeeId: number, date: string, startTime: string, endTime: string, excludeId?: number): Promise<{ valid: boolean; conflicts: string[] }>;
  calculateWorkingHours(startTime: string, endTime: string, breakDuration: number): number;
  calculateOvertimeHours(employeeId: number, date: string, totalHours: number): Promise<{ regularHours: number; overtimeHours: number }>;
  submitWeeklyTimeEntries(employeeId: number, weekStart: string): Promise<{ submitted: number; errors: string[] }>;
  
  // Time comparison and analysis
  compareTimeWithPlanning(employeeId: number, dateFrom: string, dateTo: string): Promise<any>;
  detectTimeAnomalies(employeeId: number, dateFrom?: string, dateTo?: string): Promise<any[]>;
  getTimeEntriesSummary(employeeId?: number, period?: string): Promise<any>;

  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;

  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByEmployee(employeeId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;

  // Planning Entries
  getPlanningEntry(id: number): Promise<PlanningEntry | undefined>;
  getPlanningEntriesByEmployee(employeeId: number, startDate?: string, endDate?: string): Promise<PlanningEntry[]>;
  getPlanningEntriesByStatus(status: string): Promise<PlanningEntry[]>;
  createPlanningEntry(entry: InsertPlanningEntry): Promise<PlanningEntry>;
  updatePlanningEntry(id: number, entry: Partial<InsertPlanningEntry>): Promise<PlanningEntry | undefined>;

  // Time Entries
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByEmployee(employeeId: number, startDate?: string, endDate?: string): Promise<TimeEntry[]>;
  getTimeEntriesByProject(projectId: number): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined>;

  // Tasks
  getTask(id: number): Promise<Task | undefined>;
  getTasksByEmployee(employeeId: number): Promise<Task[]>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
}

// ============================================================================
// DATABASE STORAGE IMPLEMENTATION
// ============================================================================
export class DatabaseStorage implements IStorage {
  
  // ========================================
  // USERS OPERATIONS
  // ========================================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, username: updateUser.username })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // ========================================
  // EMPLOYEES OPERATIONS
  // ========================================
  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.user_id, userId));
    return employee || undefined;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.is_active, true)).orderBy(asc(employees.last_name));
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return await db.select().from(employees)
      .where(and(eq(employees.department_id, departmentId), eq(employees.is_active, true)))
      .orderBy(asc(employees.last_name));
  }

  async getEmployeesByManager(managerId: number): Promise<Employee[]> {
    return await db.select().from(employees)
      .where(and(eq(employees.manager_id, managerId), eq(employees.is_active, true)))
      .orderBy(asc(employees.last_name));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async updateEmployee(id: number, updateEmployee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ ...updateEmployee, updated_at: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  // ========================================
  // ADVANCED EMPLOYEE OPERATIONS
  // ========================================
  async getEmployeesWithPagination(
    page: number = 1, 
    limit: number = 10, 
    filters?: { 
      search?: string; 
      department?: number; 
      status?: string; 
      sortBy?: string; 
      sortOrder?: string; 
    }
  ): Promise<{ employees: any[]; total: number; page: number; totalPages: number; }> {
    const offset = (page - 1) * limit;
    const isActive = filters?.status === 'active' ? true : filters?.status === 'inactive' ? false : undefined;
    
    // Build conditions array
    const conditions = [];
    
    if (isActive !== undefined) {
      conditions.push(eq(employees.is_active, isActive));
    }
    
    if (filters?.department) {
      conditions.push(eq(employees.department_id, filters.department));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(employees.first_name, searchTerm),
          like(employees.last_name, searchTerm),
          like(users.email, searchTerm),
          like(employees.employee_number, searchTerm)
        )
      );
    }

    // Main query with joins
    let query = db
      .select({
        id: employees.id,
        userId: employees.user_id,
        employeeNumber: employees.employee_number,
        firstName: employees.first_name,
        lastName: employees.last_name,
        departmentId: employees.department_id,
        managerId: employees.manager_id,
        hireDate: employees.hire_date,
        contractType: employees.contract_type,
        hourlyRate: employees.hourly_rate,
        vacationDaysTotal: employees.vacation_days_total,
        vacationDaysUsed: employees.vacation_days_used,
        isActive: employees.is_active,
        phone: employees.phone,
        address: employees.address,
        createdAt: employees.created_at,
        updatedAt: employees.updated_at,
        userEmail: users.email,
        userRole: users.role,
        departmentName: departments.name,
      })
      .from(employees)
      .leftJoin(users, eq(employees.user_id, users.id))
      .leftJoin(departments, eq(employees.department_id, departments.id));

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ORDER BY
    const sortDirection = filters?.sortOrder === 'asc' ? asc : desc;
    switch (filters?.sortBy) {
      case 'name':
        query = query.orderBy(sortDirection(employees.last_name), sortDirection(employees.first_name));
        break;
      case 'hire_date':
        query = query.orderBy(sortDirection(employees.hire_date));
        break;
      case 'department':
        query = query.orderBy(sortDirection(departments.name));
        break;
      default:
        query = query.orderBy(sortDirection(employees.created_at));
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    // Count query
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .leftJoin(users, eq(employees.user_id, users.id))
      .leftJoin(departments, eq(employees.department_id, departments.id));
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    // Execute both queries
    const [employeesResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      employees: employeesResult,
      total,
      page,
      totalPages,
    };
  }

  async getEmployeeWithDetails(id: number): Promise<any> {
    const [employee] = await db
      .select({
        id: employees.id,
        userId: employees.user_id,
        employeeNumber: employees.employee_number,
        firstName: employees.first_name,
        lastName: employees.last_name,
        departmentId: employees.department_id,
        managerId: employees.manager_id,
        hireDate: employees.hire_date,
        contractType: employees.contract_type,
        hourlyRate: employees.hourly_rate,
        vacationDaysTotal: employees.vacation_days_total,
        vacationDaysUsed: employees.vacation_days_used,
        isActive: employees.is_active,
        phone: employees.phone,
        address: employees.address,
        createdAt: employees.created_at,
        updatedAt: employees.updated_at,
        // User data
        userEmail: users.email,
        userRole: users.role,
        userUsername: users.username,
        // Department data
        departmentName: departments.name,
        departmentDescription: departments.description,
      })
      .from(employees)
      .leftJoin(users, eq(employees.user_id, users.id))
      .leftJoin(departments, eq(employees.department_id, departments.id))
      .where(eq(employees.id, id));

    if (!employee) return undefined;

    // Get manager info if exists
    let manager = null;
    if (employee.managerId) {
      const [managerData] = await db
        .select({
          id: employees.id,
          firstName: employees.first_name,
          lastName: employees.last_name,
          email: users.email,
        })
        .from(employees)
        .leftJoin(users, eq(employees.user_id, users.id))
        .where(eq(employees.id, employee.managerId));
      
      manager = managerData || null;
    }

    // Get subordinates
    const subordinates = await db
      .select({
        id: employees.id,
        firstName: employees.first_name,
        lastName: employees.last_name,
        email: users.email,
      })
      .from(employees)
      .leftJoin(users, eq(employees.user_id, users.id))
      .where(eq(employees.manager_id, id));

    return {
      ...employee,
      manager,
      subordinates,
    };
  }

  async getEmployeeStats(id: number): Promise<any> {
    const employee = await this.getEmployee(id);
    if (!employee) return null;

    // Calculate date ranges
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get time entries stats (this week, this month)
    const thisWeekHours = await db
      .select({ totalHours: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600), 0)` })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          gte(timeEntries.date, weekStart.toISOString().split('T')[0]),
          eq(timeEntries.status, 'validated')
        )
      );

    const thisMonthHours = await db
      .select({ totalHours: sql<number>`COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600), 0)` })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          gte(timeEntries.date, monthStart.toISOString().split('T')[0]),
          eq(timeEntries.status, 'validated')
        )
      );

    // Get vacation stats
    const vacationTaken = await db
      .select({ count: sql<number>`count(*)` })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, id),
          eq(planningEntries.type, 'vacation'),
          eq(planningEntries.status, 'validated'),
          gte(planningEntries.date, yearStart.toISOString().split('T')[0])
        )
      );

    // Get validation rate (percentage of submitted entries that are validated)
    const totalSubmitted = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          sql`status IN ('submitted', 'validated', 'rejected')`
        )
      );

    const totalValidated = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          eq(timeEntries.status, 'validated')
        )
      );

    // Get active projects
    const activeProjects = await db
      .select({
        projectId: projects.id,
        projectName: projects.name,
        projectStatus: projects.status,
        role: projectAssignments.role,
      })
      .from(projectAssignments)
      .leftJoin(projects, eq(projectAssignments.project_id, projects.id))
      .where(
        and(
          eq(projectAssignments.employee_id, id),
          eq(projects.status, 'active')
        )
      );

    const submittedCount = totalSubmitted[0]?.count || 0;
    const validatedCount = totalValidated[0]?.count || 0;
    const validationRate = submittedCount > 0 ? (validatedCount / submittedCount) * 100 : 0;

    return {
      weeklyHours: thisWeekHours[0]?.totalHours || 0,
      monthlyHours: thisMonthHours[0]?.totalHours || 0,
      vacationDaysUsed: employee.vacation_days_used,
      vacationDaysRemaining: employee.vacation_days_total - employee.vacation_days_used,
      validationRate: Math.round(validationRate * 100) / 100,
      totalSubmissions: submittedCount,
      totalValidated: validatedCount,
      activeProjects: activeProjects,
    };
  }

  async softDeleteEmployee(id: number): Promise<Employee | undefined> {
    // Check for future planning entries
    const futureEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, id),
          gte(planningEntries.date, new Date().toISOString().split('T')[0])
        )
      );

    if ((futureEntries[0]?.count || 0) > 0) {
      throw new Error('Cannot deactivate employee with future planning entries');
    }

    // Soft delete (set as inactive)
    const [employee] = await db
      .update(employees)
      .set({ 
        is_active: false, 
        updated_at: new Date() 
      })
      .where(eq(employees.id, id))
      .returning();

    return employee || undefined;
  }

  // ========================================
  // PLANNING OPERATIONS
  // ========================================

  async getPlanningEntries(
    startDate: string,
    endDate: string,
    employeeId?: number,
    departmentId?: number
  ): Promise<any[]> {
    let query = db
      .select({
        id: planningEntries.id,
        employeeId: planningEntries.employee_id,
        date: planningEntries.date,
        startTime: planningEntries.start_time,
        endTime: planningEntries.end_time,
        type: planningEntries.type,
        status: planningEntries.status,
        notes: planningEntries.notes,
        createdAt: planningEntries.created_at,
        updatedAt: planningEntries.updated_at,
        // Employee info
        employeeFirstName: employees.first_name,
        employeeLastName: employees.last_name,
        employeeNumber: employees.employee_number,
        // Department info
        departmentName: departments.name,
      })
      .from(planningEntries)
      .leftJoin(employees, eq(planningEntries.employee_id, employees.id))
      .leftJoin(departments, eq(employees.department_id, departments.id));

    const conditions = [
      gte(planningEntries.date, startDate),
      lte(planningEntries.date, endDate)
    ];

    if (employeeId) {
      conditions.push(eq(planningEntries.employee_id, employeeId));
    }

    if (departmentId) {
      conditions.push(eq(employees.department_id, departmentId));
    }

    query = query.where(and(...conditions));
    query = query.orderBy(planningEntries.date, planningEntries.start_time);

    return await query;
  }

  async getEmployeeWeeklyPlanning(employeeId: number, weekStart: string): Promise<any> {
    // Calculate week end (6 days after start)
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Get planning entries for the week
    const planningEntriesData = await this.getPlanningEntries(weekStart, weekEnd, employeeId);

    // Get corresponding time entries for comparison
    const timeEntriesData = await db
      .select({
        id: timeEntries.id,
        date: timeEntries.date,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
        status: timeEntries.status,
        actualHours: sql<number>`EXTRACT(EPOCH FROM (end_time - start_time))/3600`,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, weekStart),
          lte(timeEntries.date, weekEnd)
        )
      )
      .orderBy(timeEntries.date, timeEntries.start_time);

    // Get validation status
    const validation = await this.getValidationByEmployeeAndWeek(employeeId, weekStart);

    // Calculate totals
    let plannedHours = 0;
    let actualHours = 0;

    planningEntriesData.forEach(entry => {
      if (entry.startTime && entry.endTime && entry.type === 'work') {
        const start = new Date(`1970-01-01T${entry.startTime}:00`);
        const end = new Date(`1970-01-01T${entry.endTime}:00`);
        plannedHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    timeEntriesData.forEach(entry => {
      actualHours += entry.actualHours || 0;
    });

    return {
      employeeId,
      weekStart,
      weekEnd,
      planningEntries: planningEntriesData,
      timeEntries: timeEntriesData,
      validation,
      summary: {
        plannedHours: Math.round(plannedHours * 100) / 100,
        actualHours: Math.round(actualHours * 100) / 100,
        variance: Math.round((actualHours - plannedHours) * 100) / 100,
        validationStatus: validation?.status || 'pending',
      },
    };
  }

  async createPlanningEntry(entry: InsertPlanningEntry): Promise<PlanningEntry> {
    const [newEntry] = await db
      .insert(planningEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updatePlanningEntry(id: number, entry: Partial<InsertPlanningEntry>): Promise<PlanningEntry | undefined> {
    const [updatedEntry] = await db
      .update(planningEntries)
      .set({ ...entry, updated_at: new Date() })
      .where(eq(planningEntries.id, id))
      .returning();
    return updatedEntry || undefined;
  }

  async deletePlanningEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(planningEntries)
      .where(eq(planningEntries.id, id));
    return result.rowCount > 0;
  }

  async bulkCreatePlanningEntries(entries: InsertPlanningEntry[]): Promise<PlanningEntry[]> {
    const newEntries = await db
      .insert(planningEntries)
      .values(entries)
      .returning();
    return newEntries;
  }

  async bulkUpdatePlanningEntries(updates: { id: number; data: Partial<InsertPlanningEntry> }[]): Promise<PlanningEntry[]> {
    const results = [];
    
    // Process updates in a transaction-like manner
    for (const update of updates) {
      const result = await this.updatePlanningEntry(update.id, update.data);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  // ========================================
  // PLANNING VALIDATION
  // ========================================

  async createValidation(validation: InsertValidation): Promise<Validation> {
    const [newValidation] = await db
      .insert(validations)
      .values(validation)
      .returning();
    return newValidation;
  }

  async getValidationByEmployeeAndWeek(employeeId: number, weekStart: string): Promise<Validation | undefined> {
    const [validation] = await db
      .select()
      .from(validations)
      .where(
        and(
          eq(validations.employee_id, employeeId),
          eq(validations.week_start, weekStart)
        )
      );
    return validation || undefined;
  }

  // ========================================
  // PLANNING CONFLICTS AND VALIDATION LOGIC
  // ========================================

  async validateDailyHours(employeeId: number, date: string, startTime: string, endTime: string): Promise<{ valid: boolean; hours: number; conflicts: string[] }> {
    const conflicts = [];
    
    // Calculate hours for this entry
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const entryHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    // Get existing entries for the same day
    const existingEntries = await db
      .select({
        startTime: planningEntries.start_time,
        endTime: planningEntries.end_time,
      })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, employeeId),
          eq(planningEntries.date, date),
          eq(planningEntries.type, 'work')
        )
      );

    // Calculate total daily hours including this entry
    let totalDailyHours = entryHours;
    existingEntries.forEach(entry => {
      if (entry.startTime && entry.endTime) {
        const existingStart = new Date(`1970-01-01T${entry.startTime}:00`);
        const existingEnd = new Date(`1970-01-01T${entry.endTime}:00`);
        totalDailyHours += (existingEnd.getTime() - existingStart.getTime()) / (1000 * 60 * 60);
      }
    });

    // Check daily limit (10h max)
    if (totalDailyHours > 10) {
      conflicts.push(`Daily hours exceed 10h limit (${totalDailyHours.toFixed(1)}h total)`);
    }

    // Check for overlaps
    for (const existing of existingEntries) {
      if (existing.startTime && existing.endTime) {
        const existingStart = new Date(`1970-01-01T${existing.startTime}:00`);
        const existingEnd = new Date(`1970-01-01T${existing.endTime}:00`);
        
        if ((start < existingEnd && end > existingStart)) {
          conflicts.push(`Time overlap with existing entry ${existing.startTime}-${existing.endTime}`);
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      hours: entryHours,
      conflicts,
    };
  }

  async validateWeeklyHours(employeeId: number, weekStart: string): Promise<{ valid: boolean; totalHours: number; conflicts: string[] }> {
    const conflicts = [];
    
    // Calculate week end
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Get all work entries for the week
    const weeklyEntries = await db
      .select({
        startTime: planningEntries.start_time,
        endTime: planningEntries.end_time,
        date: planningEntries.date,
      })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, employeeId),
          gte(planningEntries.date, weekStart),
          lte(planningEntries.date, weekEnd),
          eq(planningEntries.type, 'work')
        )
      );

    // Calculate total weekly hours
    let totalWeeklyHours = 0;
    weeklyEntries.forEach(entry => {
      if (entry.startTime && entry.endTime) {
        const start = new Date(`1970-01-01T${entry.startTime}:00`);
        const end = new Date(`1970-01-01T${entry.endTime}:00`);
        totalWeeklyHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    // Check weekly limit (48h max)
    if (totalWeeklyHours > 48) {
      conflicts.push(`Weekly hours exceed 48h limit (${totalWeeklyHours.toFixed(1)}h total)`);
    }

    // Check average weekly hours (35h target)
    if (totalWeeklyHours < 30) {
      conflicts.push(`Weekly hours below recommended minimum (${totalWeeklyHours.toFixed(1)}h, target: 35h)`);
    }

    return {
      valid: conflicts.length === 0,
      totalHours: totalWeeklyHours,
      conflicts,
    };
  }

  async validateRestPeriod(employeeId: number, date: string, startTime: string): Promise<{ valid: boolean; conflicts: string[] }> {
    const conflicts = [];
    
    // Get previous day's last entry
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const [lastEntry] = await db
      .select({
        endTime: planningEntries.end_time,
        date: planningEntries.date,
      })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, employeeId),
          eq(planningEntries.date, yesterdayStr),
          eq(planningEntries.type, 'work')
        )
      )
      .orderBy(desc(planningEntries.end_time))
      .limit(1);

    if (lastEntry && lastEntry.endTime) {
      // Calculate rest period
      const lastEndTime = new Date(`1970-01-01T${lastEntry.endTime}:00`);
      const nextStartTime = new Date(`1970-01-01T${startTime}:00`);
      
      // Add 24 hours to handle day transition
      nextStartTime.setDate(nextStartTime.getDate() + 1);
      
      const restHours = (nextStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);
      
      // Check 11h minimum rest period
      if (restHours < 11) {
        conflicts.push(`Insufficient rest period: ${restHours.toFixed(1)}h (minimum: 11h)`);
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
    };
  }

  async detectPlanningConflicts(employeeId?: number, startDate?: string, endDate?: string): Promise<any[]> {
    const conflicts = [];
    
    // Default date range (current week)
    const defaultStart = startDate || new Date().toISOString().split('T')[0];
    const defaultEnd = endDate || (() => {
      const end = new Date(defaultStart);
      end.setDate(end.getDate() + 6);
      return end.toISOString().split('T')[0];
    })();

    // Get employees to check
    let employeeIds = [];
    if (employeeId) {
      employeeIds = [employeeId];
    } else {
      const activeEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.is_active, true));
      employeeIds = activeEmployees.map(emp => emp.id);
    }

    // Check conflicts for each employee
    for (const empId of employeeIds) {
      const entries = await this.getPlanningEntries(defaultStart, defaultEnd, empId);
      
      // Group by date for daily validation
      const entriesByDate = entries.reduce((acc, entry) => {
        if (!acc[entry.date]) acc[entry.date] = [];
        acc[entry.date].push(entry);
        return acc;
      }, {} as Record<string, any[]>);

      // Check daily conflicts
      for (const [date, dayEntries] of Object.entries(entriesByDate)) {
        let dailyHours = 0;
        const workEntries = dayEntries.filter(e => e.type === 'work');
        
        // Calculate total daily hours
        workEntries.forEach(entry => {
          if (entry.startTime && entry.endTime) {
            const start = new Date(`1970-01-01T${entry.startTime}:00`);
            const end = new Date(`1970-01-01T${entry.endTime}:00`);
            dailyHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }
        });

        // Daily hours conflict
        if (dailyHours > 10) {
          conflicts.push({
            type: 'max_daily_hours',
            severity: 'error',
            employeeId: empId,
            date,
            description: `Daily hours exceed 10h limit (${dailyHours.toFixed(1)}h)`,
            suggestions: ['Reduce working hours', 'Split shifts across multiple days'],
          });
        }

        // Check overlaps
        for (let i = 0; i < workEntries.length; i++) {
          for (let j = i + 1; j < workEntries.length; j++) {
            const entry1 = workEntries[i];
            const entry2 = workEntries[j];
            
            if (entry1.startTime && entry1.endTime && entry2.startTime && entry2.endTime) {
              const start1 = new Date(`1970-01-01T${entry1.startTime}:00`);
              const end1 = new Date(`1970-01-01T${entry1.endTime}:00`);
              const start2 = new Date(`1970-01-01T${entry2.startTime}:00`);
              const end2 = new Date(`1970-01-01T${entry2.endTime}:00`);
              
              if (start1 < end2 && start2 < end1) {
                conflicts.push({
                  type: 'overlap',
                  severity: 'error',
                  employeeId: empId,
                  date,
                  description: `Time overlap: ${entry1.startTime}-${entry1.endTime} and ${entry2.startTime}-${entry2.endTime}`,
                  suggestions: ['Adjust start/end times', 'Remove conflicting entry'],
                });
              }
            }
          }
        }
      }

      // Check weekly hours
      const weekStart = defaultStart;
      const weeklyValidation = await this.validateWeeklyHours(empId, weekStart);
      if (!weeklyValidation.valid) {
        weeklyValidation.conflicts.forEach(conflict => {
          conflicts.push({
            type: 'max_weekly_hours',
            severity: weeklyValidation.totalHours > 48 ? 'error' : 'warning',
            employeeId: empId,
            date: weekStart,
            description: conflict,
            suggestions: ['Reduce daily hours', 'Add rest days'],
          });
        });
      }
    }

    return conflicts;
  }

  // ========================================
  // PLANNING GENERATION
  // ========================================

  async generatePlanningForPeriod(
    startDate: string,
    endDate: string,
    employeeIds?: number[],
    departmentId?: number,
    templateId?: number
  ): Promise<PlanningEntry[]> {
    const generatedEntries = [];
    
    // Get target employees
    let targetEmployees = [];
    if (employeeIds && employeeIds.length > 0) {
      targetEmployees = employeeIds;
    } else if (departmentId) {
      const deptEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.department_id, departmentId),
            eq(employees.is_active, true)
          )
        );
      targetEmployees = deptEmployees.map(emp => emp.id);
    } else {
      const allEmployees = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.is_active, true));
      targetEmployees = allEmployees.map(emp => emp.id);
    }

    // Generate planning entries
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (const employeeId of targetEmployees) {
      const current = new Date(start);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Skip weekends for basic template
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          // Basic 9-5 template
          const entry: InsertPlanningEntry = {
            employee_id: employeeId,
            date: dateStr,
            start_time: '09:00',
            end_time: '17:00',
            type: 'work',
            status: 'draft',
            notes: 'Auto-generated planning entry',
          };

          // Validate before creating
          const validation = await this.validateDailyHours(employeeId, dateStr, '09:00', '17:00');
          if (validation.valid) {
            const created = await this.createPlanningEntry(entry);
            generatedEntries.push(created);
          }
        }
        
        current.setDate(current.getDate() + 1);
      }
    }

    return generatedEntries;
  }

  // ========================================
  // TIME ENTRIES OPERATIONS
  // ========================================

  async getTimeEntries(
    employeeId?: number,
    dateFrom?: string,
    dateTo?: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ entries: any[]; total: number; page: number; totalPages: number }> {
    let query = db
      .select({
        id: timeEntries.id,
        employeeId: timeEntries.employee_id,
        date: timeEntries.date,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
        breakDuration: timeEntries.break_duration,
        projectId: timeEntries.project_id,
        taskId: timeEntries.task_id,
        description: timeEntries.description,
        location: timeEntries.location,
        isOvertime: timeEntries.is_overtime,
        overtimeReason: timeEntries.overtime_reason,
        status: timeEntries.status,
        createdAt: timeEntries.created_at,
        updatedAt: timeEntries.updated_at,
        // Employee info
        employeeFirstName: employees.first_name,
        employeeLastName: employees.last_name,
        employeeNumber: employees.employee_number,
        // Project info
        projectName: projects.name,
        // Task info  
        taskName: tasks.name,
        // Calculated hours
        workingHours: sql<number>`EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0)`,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employee_id, employees.id))
      .leftJoin(projects, eq(timeEntries.project_id, projects.id))
      .leftJoin(tasks, eq(timeEntries.task_id, tasks.id));

    const conditions = [];

    if (employeeId) {
      conditions.push(eq(timeEntries.employee_id, employeeId));
    }

    if (dateFrom) {
      conditions.push(gte(timeEntries.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(timeEntries.date, dateTo));
    }

    if (status) {
      conditions.push(eq(timeEntries.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(timeEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated results
    const entries = await query
      .orderBy(desc(timeEntries.date), desc(timeEntries.start_time))
      .limit(limit)
      .offset(offset);

    return {
      entries,
      total,
      page,
      totalPages,
    };
  }

  async getTimeEntriesByEmployee(employeeId: number, date?: string): Promise<any[]> {
    let query = db
      .select({
        id: timeEntries.id,
        date: timeEntries.date,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
        breakDuration: timeEntries.break_duration,
        projectId: timeEntries.project_id,
        taskId: timeEntries.task_id,
        description: timeEntries.description,
        location: timeEntries.location,
        isOvertime: timeEntries.is_overtime,
        overtimeReason: timeEntries.overtime_reason,
        status: timeEntries.status,
        workingHours: sql<number>`EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0)`,
        projectName: projects.name,
        taskName: tasks.name,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.project_id, projects.id))
      .leftJoin(tasks, eq(timeEntries.task_id, tasks.id))
      .where(eq(timeEntries.employee_id, employeeId));

    if (date) {
      query = query.where(
        and(
          eq(timeEntries.employee_id, employeeId),
          eq(timeEntries.date, date)
        )
      );
    }

    return await query.orderBy(timeEntries.date, timeEntries.start_time);
  }

  async getCurrentDayTimeEntries(employeeId: number): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getTimeEntriesByEmployee(employeeId, today);
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db
      .insert(timeEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  async updateTimeEntry(id: number, entry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({ ...entry, updated_at: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry || undefined;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, id));
    return result.rowCount > 0;
  }

  async bulkCreateTimeEntries(entries: InsertTimeEntry[]): Promise<TimeEntry[]> {
    const newEntries = await db
      .insert(timeEntries)
      .values(entries)
      .returning();
    return newEntries;
  }

  async bulkUpdateTimeEntries(updates: { id: number; data: Partial<InsertTimeEntry> }[]): Promise<TimeEntry[]> {
    const results = [];
    
    for (const update of updates) {
      const result = await this.updateTimeEntry(update.id, update.data);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  // ========================================
  // TIME ENTRY VALIDATION AND BUSINESS LOGIC
  // ========================================

  async validateTimeEntryOverlap(
    employeeId: number, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeId?: number
  ): Promise<{ valid: boolean; conflicts: string[] }> {
    const conflicts = [];

    // Get existing entries for the same day
    let query = db
      .select({
        id: timeEntries.id,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          eq(timeEntries.date, date)
        )
      );

    if (excludeId) {
      query = query.where(
        and(
          eq(timeEntries.employee_id, employeeId),
          eq(timeEntries.date, date),
          ne(timeEntries.id, excludeId)
        )
      );
    }

    const existingEntries = await query;

    // Check for overlaps
    const newStart = new Date(`1970-01-01T${startTime}:00`);
    const newEnd = new Date(`1970-01-01T${endTime}:00`);

    for (const existing of existingEntries) {
      if (existing.startTime && existing.endTime) {
        const existingStart = new Date(`1970-01-01T${existing.startTime}:00`);
        const existingEnd = new Date(`1970-01-01T${existing.endTime}:00`);
        
        if (newStart < existingEnd && newEnd > existingStart) {
          conflicts.push(`Time overlap with existing entry ${existing.startTime}-${existing.endTime}`);
        }
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
    };
  }

  calculateWorkingHours(startTime: string, endTime: string, breakDuration: number): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workingMinutes = totalMinutes - breakDuration;
    return Math.max(0, workingMinutes / 60); // Hours
  }

  async calculateOvertimeHours(
    employeeId: number, 
    date: string, 
    totalHours: number
  ): Promise<{ regularHours: number; overtimeHours: number }> {
    // Get daily legal limit (10h) and weekly context
    const dailyLimit = 10;
    
    // Calculate week start for weekly overtime calculation
    const dateObj = new Date(date);
    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() - dateObj.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Get weekly hours so far (excluding current entry)
    const weeklyEntries = await db
      .select({
        workingHours: sql<number>`EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0)`,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, weekStartStr),
          lt(timeEntries.date, date), // Before current date
          eq(timeEntries.status, 'validated')
        )
      );

    const weeklyHoursBeforeToday = weeklyEntries.reduce((sum, entry) => sum + (entry.workingHours || 0), 0);
    const totalWeeklyHours = weeklyHoursBeforeToday + totalHours;

    // Calculate overtime
    let dailyOvertime = Math.max(0, totalHours - dailyLimit);
    let weeklyOvertime = Math.max(0, totalWeeklyHours - 48); // 48h weekly limit
    
    // Use the maximum of daily or weekly overtime
    const overtimeHours = Math.max(dailyOvertime, weeklyOvertime);
    const regularHours = totalHours - overtimeHours;

    return {
      regularHours: Math.max(0, regularHours),
      overtimeHours: Math.max(0, overtimeHours),
    };
  }

  async submitWeeklyTimeEntries(employeeId: number, weekStart: string): Promise<{ submitted: number; errors: string[] }> {
    const errors = [];
    
    // Calculate week end
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Get all draft time entries for the week
    const draftEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, weekStart),
          lte(timeEntries.date, weekEnd),
          eq(timeEntries.status, 'draft')
        )
      );

    if (draftEntries.length === 0) {
      errors.push('No draft entries found for the specified week');
      return { submitted: 0, errors };
    }

    // Validate completeness (should have entries for working days)
    const workingDays = [];
    const current = new Date(weekStartDate);
    while (current <= weekEndDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        workingDays.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    const entriesByDate = draftEntries.reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = [];
      acc[entry.date].push(entry);
      return acc;
    }, {} as Record<string, any[]>);

    // Check for missing working days (optional validation)
    const missingDays = workingDays.filter(day => !entriesByDate[day]);
    if (missingDays.length > 0) {
      errors.push(`Missing time entries for working days: ${missingDays.join(', ')}`);
    }

    // Submit all valid entries
    let submitted = 0;
    for (const entry of draftEntries) {
      try {
        await this.updateTimeEntry(entry.id, { status: 'submitted' });
        submitted++;
      } catch (error) {
        errors.push(`Failed to submit entry ${entry.id}: ${error}`);
      }
    }

    return { submitted, errors };
  }

  // ========================================
  // TIME COMPARISON AND ANALYSIS
  // ========================================

  async compareTimeWithPlanning(employeeId: number, dateFrom: string, dateTo: string): Promise<any> {
    // Get time entries
    const timeEntriesData = await db
      .select({
        date: timeEntries.date,
        workingHours: sql<number>`EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0)`,
        isOvertime: timeEntries.is_overtime,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, dateFrom),
          lte(timeEntries.date, dateTo)
        )
      );

    // Get planning entries
    const planningData = await this.getPlanningEntries(dateFrom, dateTo, employeeId);

    // Group and compare by date
    const comparison = [];
    const dateSet = new Set([
      ...timeEntriesData.map(e => e.date),
      ...planningData.map(e => e.date)
    ]);

    let totalPlannedHours = 0;
    let totalActualHours = 0;
    let totalOvertimeHours = 0;

    for (const date of Array.from(dateSet).sort()) {
      const dayTimeEntries = timeEntriesData.filter(e => e.date === date);
      const dayPlanningEntries = planningData.filter(e => e.date === date);

      const actualHours = dayTimeEntries.reduce((sum, entry) => sum + (entry.workingHours || 0), 0);
      const overtimeHours = dayTimeEntries
        .filter(entry => entry.isOvertime)
        .reduce((sum, entry) => sum + (entry.workingHours || 0), 0);

      let plannedHours = 0;
      dayPlanningEntries.forEach(entry => {
        if (entry.startTime && entry.endTime && entry.type === 'work') {
          const start = new Date(`1970-01-01T${entry.startTime}:00`);
          const end = new Date(`1970-01-01T${entry.endTime}:00`);
          plannedHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
      });

      const variance = actualHours - plannedHours;

      comparison.push({
        date,
        plannedHours: Math.round(plannedHours * 100) / 100,
        actualHours: Math.round(actualHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        hasPlanning: dayPlanningEntries.length > 0,
        hasTimeEntries: dayTimeEntries.length > 0,
      });

      totalPlannedHours += plannedHours;
      totalActualHours += actualHours;
      totalOvertimeHours += overtimeHours;
    }

    const totalVariance = totalActualHours - totalPlannedHours;

    return {
      employeeId,
      period: { from: dateFrom, to: dateTo },
      dailyComparison: comparison,
      summary: {
        totalPlannedHours: Math.round(totalPlannedHours * 100) / 100,
        totalActualHours: Math.round(totalActualHours * 100) / 100,
        totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
        totalVariance: Math.round(totalVariance * 100) / 100,
        complianceRate: totalPlannedHours > 0 ? Math.round((1 - Math.abs(totalVariance) / totalPlannedHours) * 100) : 0,
      },
    };
  }

  async detectTimeAnomalies(employeeId: number, dateFrom?: string, dateTo?: string): Promise<any[]> {
    const anomalies = [];
    
    // Default to current week if no dates provided
    const defaultStart = dateFrom || new Date().toISOString().split('T')[0];
    const defaultEnd = dateTo || (() => {
      const end = new Date(defaultStart);
      end.setDate(end.getDate() + 6);
      return end.toISOString().split('T')[0];
    })();

    // Get time entries and planning for the period
    const timeEntriesData = await this.getTimeEntriesByEmployee(employeeId, undefined);
    const planningData = await this.getPlanningEntries(defaultStart, defaultEnd, employeeId);
    
    // Filter time entries by date range
    const filteredTimeEntries = timeEntriesData.filter(entry => 
      entry.date >= defaultStart && entry.date <= defaultEnd
    );

    // Anomaly 1: Time entries without corresponding planning
    for (const timeEntry of filteredTimeEntries) {
      const hasPlanning = planningData.some(planning => 
        planning.date === timeEntry.date && planning.type === 'work'
      );
      
      if (!hasPlanning) {
        anomalies.push({
          type: 'no_planning',
          severity: 'warning',
          date: timeEntry.date,
          description: `Time entry recorded without corresponding planning`,
          suggestion: 'Create planning entry or verify if work was authorized',
        });
      }
    }

    // Anomaly 2: Large variance between planned and actual hours
    const comparison = await this.compareTimeWithPlanning(employeeId, defaultStart, defaultEnd);
    for (const day of comparison.dailyComparison) {
      const varianceThreshold = 2; // 2 hours
      if (Math.abs(day.variance) > varianceThreshold && day.hasPlanning) {
        anomalies.push({
          type: 'large_variance',
          severity: day.variance > 0 ? 'warning' : 'info',
          date: day.date,
          description: `Large variance: ${day.variance > 0 ? '+' : ''}${day.variance}h vs planned`,
          suggestion: day.variance > 0 
            ? 'Consider if overtime was authorized'
            : 'Check if early departure was approved',
        });
      }
    }

    // Anomaly 3: Missing breaks for long shifts
    for (const timeEntry of filteredTimeEntries) {
      if (timeEntry.workingHours > 6 && timeEntry.breakDuration < 30) {
        anomalies.push({
          type: 'missing_break',
          severity: 'warning',
          date: timeEntry.date,
          description: `${timeEntry.workingHours}h shift with only ${timeEntry.breakDuration}min break`,
          suggestion: 'Ensure proper break time for shifts over 6 hours',
        });
      }
    }

    // Anomaly 4: Overtime without approval
    for (const timeEntry of filteredTimeEntries) {
      if (timeEntry.isOvertime && !timeEntry.overtimeReason) {
        anomalies.push({
          type: 'overtime_without_approval',
          severity: 'error',
          date: timeEntry.date,
          description: 'Overtime marked without justification',
          suggestion: 'Add overtime reason or verify authorization',
        });
      }
    }

    return anomalies;
  }

  async getTimeEntriesSummary(employeeId?: number, period: string = 'current_month'): Promise<any> {
    // Calculate date range based on period
    let startDate: string;
    let endDate: string;
    const now = new Date();

    switch (period) {
      case 'current_week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sunday
        startDate = weekStart.toISOString().split('T')[0];
        endDate = weekEnd.toISOString().split('T')[0];
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    // Build query
    let query = db
      .select({
        totalHours: sql<number>`SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0))`,
        totalEntries: sql<number>`COUNT(*)`,
        overtimeHours: sql<number>`SUM(CASE WHEN is_overtime THEN EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0) ELSE 0 END)`,
        avgDailyHours: sql<number>`AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600 - (break_duration/60.0))`,
      })
      .from(timeEntries)
      .where(
        and(
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate),
          ne(timeEntries.status, 'rejected')
        )
      );

    if (employeeId) {
      query = query.where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate),
          ne(timeEntries.status, 'rejected')
        )
      );
    }

    const [summary] = await query;

    // Get status breakdown
    let statusQuery = db
      .select({
        status: timeEntries.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(timeEntries)
      .where(
        and(
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate)
        )
      )
      .groupBy(timeEntries.status);

    if (employeeId) {
      statusQuery = statusQuery.where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, startDate),
          lte(timeEntries.date, endDate)
        )
      );
    }

    const statusBreakdown = await statusQuery;

    return {
      period: { start: startDate, end: endDate, type: period },
      summary: {
        totalHours: Math.round((summary?.totalHours || 0) * 100) / 100,
        totalEntries: summary?.totalEntries || 0,
        overtimeHours: Math.round((summary?.overtimeHours || 0) * 100) / 100,
        avgDailyHours: Math.round((summary?.avgDailyHours || 0) * 100) / 100,
      },
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ========================================
  // DEPARTMENTS OPERATIONS
  // ========================================
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department || undefined;
  }

  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.name));
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    return department;
  }

  async updateDepartment(id: number, updateDepartment: Partial<InsertDepartment>): Promise<Department | undefined> {
    const [department] = await db
      .update(departments)
      .set({ ...updateDepartment, updated_at: new Date() })
      .where(eq(departments.id, id))
      .returning();
    return department || undefined;
  }

  // ========================================
  // PROJECTS OPERATIONS
  // ========================================
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.created_at));
  }

  async getProjectsByEmployee(employeeId: number): Promise<Project[]> {
    return await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        client_name: projects.client_name,
        status: projects.status,
        start_date: projects.start_date,
        end_date: projects.end_date,
        budget: projects.budget,
        hourly_rate: projects.hourly_rate,
        created_by: projects.created_by,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
      })
      .from(projects)
      .innerJoin(projectAssignments, eq(projects.id, projectAssignments.project_id))
      .where(eq(projectAssignments.employee_id, employeeId))
      .orderBy(desc(projects.created_at));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: number, updateProject: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...updateProject, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  // ========================================
  // PLANNING ENTRIES OPERATIONS
  // ========================================
  async getPlanningEntry(id: number): Promise<PlanningEntry | undefined> {
    const [entry] = await db.select().from(planningEntries).where(eq(planningEntries.id, id));
    return entry || undefined;
  }

  async getPlanningEntriesByEmployee(employeeId: number, startDate?: string, endDate?: string): Promise<PlanningEntry[]> {
    if (startDate && endDate) {
      return await db.select().from(planningEntries)
        .where(
          and(
            eq(planningEntries.employee_id, employeeId),
            gte(planningEntries.date, startDate),
            lte(planningEntries.date, endDate)
          )
        )
        .orderBy(asc(planningEntries.date));
    }
    
    return await db.select().from(planningEntries)
      .where(eq(planningEntries.employee_id, employeeId))
      .orderBy(asc(planningEntries.date));
  }

  async getPlanningEntriesByStatus(status: string): Promise<PlanningEntry[]> {
    return await db.select().from(planningEntries)
      .where(eq(planningEntries.status, status as any))
      .orderBy(desc(planningEntries.created_at));
  }

  async createPlanningEntry(insertEntry: InsertPlanningEntry): Promise<PlanningEntry> {
    const [entry] = await db
      .insert(planningEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updatePlanningEntry(id: number, updateEntry: Partial<InsertPlanningEntry>): Promise<PlanningEntry | undefined> {
    const [entry] = await db
      .update(planningEntries)
      .set({ ...updateEntry, updated_at: new Date() })
      .where(eq(planningEntries.id, id))
      .returning();
    return entry || undefined;
  }

  // ========================================
  // TIME ENTRIES OPERATIONS
  // ========================================
  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const [entry] = await db.select().from(timeEntries).where(eq(timeEntries.id, id));
    return entry || undefined;
  }

  async getTimeEntriesByEmployee(employeeId: number, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    if (startDate && endDate) {
      return await db.select().from(timeEntries)
        .where(
          and(
            eq(timeEntries.employee_id, employeeId),
            gte(timeEntries.date, startDate),
            lte(timeEntries.date, endDate)
          )
        )
        .orderBy(desc(timeEntries.date), desc(timeEntries.start_time));
    }
    
    return await db.select().from(timeEntries)
      .where(eq(timeEntries.employee_id, employeeId))
      .orderBy(desc(timeEntries.date), desc(timeEntries.start_time));
  }

  async getTimeEntriesByProject(projectId: number): Promise<TimeEntry[]> {
    return await db.select().from(timeEntries)
      .where(eq(timeEntries.project_id, projectId))
      .orderBy(desc(timeEntries.date), desc(timeEntries.start_time));
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db
      .insert(timeEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async updateTimeEntry(id: number, updateEntry: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .update(timeEntries)
      .set({ ...updateEntry, updated_at: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();
    return entry || undefined;
  }

  // ========================================
  // TASKS OPERATIONS
  // ========================================
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByEmployee(employeeId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.assigned_to, employeeId))
      .orderBy(desc(tasks.created_at));
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.project_id, projectId))
      .orderBy(desc(tasks.created_at));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: number, updateTask: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updateTask, updated_at: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }
}

export const storage = new DatabaseStorage();
