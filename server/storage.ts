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
  notifications,
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
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, like, or, isNull, isNotNull } from "drizzle-orm";

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
      contractType?: string;
      managerId?: number;
      hiredAfter?: string;
      hiredBefore?: string;
      minWeeklyHours?: number;
      maxWeeklyHours?: number;
      hasEmail?: boolean;
      hasPhone?: boolean;
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

  // Notifications
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number, filters?: { page?: number; limit?: number; type?: string; read?: boolean; }): Promise<{ notifications: Notification[]; total: number; }>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
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
      contractType?: string;
      managerId?: number;
      hiredAfter?: string;
      hiredBefore?: string;
      minWeeklyHours?: number;
      maxWeeklyHours?: number;
      hasEmail?: boolean;
      hasPhone?: boolean;
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

    if (filters?.contractType) {
      conditions.push(eq(employees.contract_type, filters.contractType));
    }

    if (filters?.managerId) {
      conditions.push(eq(employees.manager_id, filters.managerId));
    }

    if (filters?.hiredAfter) {
      conditions.push(gte(employees.hire_date, filters.hiredAfter));
    }

    if (filters?.hiredBefore) {
      conditions.push(lte(employees.hire_date, filters.hiredBefore));
    }

    if (filters?.minWeeklyHours !== undefined) {
      conditions.push(gte(employees.weekly_hours, filters.minWeeklyHours));
    }

    if (filters?.maxWeeklyHours !== undefined) {
      conditions.push(lte(employees.weekly_hours, filters.maxWeeklyHours));
    }

    if (filters?.hasEmail !== undefined) {
      if (filters.hasEmail) {
        conditions.push(isNotNull(users.email));
      } else {
        conditions.push(isNull(users.email));
      }
    }

    if (filters?.hasPhone !== undefined) {
      if (filters.hasPhone) {
        conditions.push(isNotNull(employees.phone));
      } else {
        conditions.push(isNull(employees.phone));
      }
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
      case 'contract_type':
        query = query.orderBy(sortDirection(employees.contract_type));
        break;
      case 'weekly_hours':
        query = query.orderBy(sortDirection(employees.weekly_hours));
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
      .select({
        totalHours: sql<number>`SUM(
          CASE 
            WHEN ${timeEntries.end_time} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.end_time}::time - ${timeEntries.start_time}::time))/3600
            ELSE 0 
          END
        )`,
        overtimeHours: sql<number>`SUM(
          CASE 
            WHEN ${timeEntries.type} = 'overtime' AND ${timeEntries.end_time} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.end_time}::time - ${timeEntries.start_time}::time))/3600
            ELSE 0 
          END
        )`,
        validatedHours: sql<number>`SUM(
          CASE 
            WHEN ${timeEntries.status} = 'validated' AND ${timeEntries.end_time} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.end_time}::time - ${timeEntries.start_time}::time))/3600
            ELSE 0 
          END
        )`,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          gte(timeEntries.date, weekStart.toISOString().split('T')[0])
        )
      );

    const thisMonthHours = await db
      .select({
        totalHours: sql<number>`SUM(
          CASE 
            WHEN ${timeEntries.end_time} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.end_time}::time - ${timeEntries.start_time}::time))/3600
            ELSE 0 
          END
        )`,
        overtimeHours: sql<number>`SUM(
          CASE 
            WHEN ${timeEntries.type} = 'overtime' AND ${timeEntries.end_time} IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (${timeEntries.end_time}::time - ${timeEntries.start_time}::time))/3600
            ELSE 0 
          END
        )`,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.employee_id, id),
          gte(timeEntries.date, monthStart.toISOString().split('T')[0])
        )
      );

    // Planning entries validation rate
    const planningStats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        validated: sql<number>`COUNT(CASE WHEN ${planningEntries.status} = 'validated' THEN 1 END)`,
        rejected: sql<number>`COUNT(CASE WHEN ${planningEntries.status} = 'rejected' THEN 1 END)`,
      })
      .from(planningEntries)
      .where(
        and(
          eq(planningEntries.employee_id, id),
          gte(planningEntries.date, monthStart.toISOString().split('T')[0])
        )
      );

    // Active projects count
    const activeProjects = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(projectAssignments)
      .leftJoin(projects, eq(projectAssignments.project_id, projects.id))
      .where(
        and(
          eq(projectAssignments.employee_id, id),
          eq(projects.status, 'active')
        )
      );

    const vacationDaysRemaining = employee.vacation_days_total - employee.vacation_days_used;
    const validationRate = planningStats[0]?.total > 0 
      ? Math.round((planningStats[0]?.validated / planningStats[0]?.total) * 100)
      : 0;

    return {
      employeeId: id,
      thisWeek: {
        totalHours: Math.round((thisWeekHours[0]?.totalHours || 0) * 100) / 100,
        overtimeHours: Math.round((thisWeekHours[0]?.overtimeHours || 0) * 100) / 100,
        validatedHours: Math.round((thisWeekHours[0]?.validatedHours || 0) * 100) / 100,
      },
      thisMonth: {
        totalHours: Math.round((thisMonthHours[0]?.totalHours || 0) * 100) / 100,
        overtimeHours: Math.round((thisMonthHours[0]?.overtimeHours || 0) * 100) / 100,
      },
      vacation: {
        total: employee.vacation_days_total,
        used: employee.vacation_days_used,
        remaining: vacationDaysRemaining,
      },
      planning: {
        total: planningStats[0]?.total || 0,
        validated: planningStats[0]?.validated || 0,
        rejected: planningStats[0]?.rejected || 0,
        validationRate,
      },
      activeProjects: activeProjects[0]?.count || 0,
    };
  }

  async softDeleteEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ 
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
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
        type: planningEntries.type,
        startTime: planningEntries.start_time,
        endTime: planningEntries.end_time,
        status: planningEntries.status,
        validatedBy: planningEntries.validated_by,
        validatedAt: planningEntries.validated_at,
        comments: planningEntries.comments,
        rejectionReason: planningEntries.rejection_reason,
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
      .leftJoin(departments, eq(employees.department_id, departments.id))
      .where(
        and(
          gte(planningEntries.date, startDate),
          lte(planningEntries.date, endDate)
        )
      );

    if (employeeId) {
      query = query.where(eq(planningEntries.employee_id, employeeId));
    }

    if (departmentId) {
      query = query.where(eq(employees.department_id, departmentId));
    }

    return await query.orderBy(asc(planningEntries.date), asc(planningEntries.start_time));
  }

  // ========================================
  // TIME ENTRIES OPERATIONS
  // ========================================
  async getTimeEntriesWithFilters(
    filters: {
      startDate?: string;
      endDate?: string;
      employeeId?: number;
      projectId?: number;
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(timeEntries.date, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(timeEntries.date, filters.endDate));
    }
    if (filters.employeeId) {
      conditions.push(eq(timeEntries.employee_id, filters.employeeId));
    }
    if (filters.projectId) {
      conditions.push(eq(timeEntries.project_id, filters.projectId));
    }
    if (filters.status) {
      conditions.push(eq(timeEntries.status, filters.status));
    }
    if (filters.type) {
      conditions.push(eq(timeEntries.type, filters.type));
    }

    let query = db
      .select({
        id: timeEntries.id,
        employeeId: timeEntries.employee_id,
        projectId: timeEntries.project_id,
        date: timeEntries.date,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
        type: timeEntries.type,
        category: timeEntries.category,
        description: timeEntries.description,
        status: timeEntries.status,
        locationLatitude: timeEntries.location_latitude,
        locationLongitude: timeEntries.location_longitude,
        locationAddress: timeEntries.location_address,
        validatedBy: timeEntries.validated_by,
        validatedAt: timeEntries.validated_at,
        createdAt: timeEntries.created_at,
        updatedAt: timeEntries.updated_at,
        // Employee info
        employeeFirstName: employees.first_name,
        employeeLastName: employees.last_name,
        employeeNumber: employees.employee_number,
        // Project info
        projectName: projects.name,
        projectClient: projects.client_name,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employee_id, employees.id))
      .leftJoin(projects, eq(timeEntries.project_id, projects.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(timeEntries.date), desc(timeEntries.start_time));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  // ========================================
  // NOTIFICATIONS OPERATIONS
  // ========================================
  async getNotifications(
    userId: number,
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, userId));

    if (unreadOnly) {
      query = query.where(eq(notifications.is_read, false));
    }

    return await query
      .orderBy(desc(notifications.created_at))
      .limit(limit)
      .offset(offset);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ is_read: true, read_at: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }
}

// ============================================================================
// INSTANCE CREATION
// ============================================================================
export const storage = new DatabaseStorage();
