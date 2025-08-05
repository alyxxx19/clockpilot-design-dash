import { 
  users, 
  employees,
  departments,
  projects,
  projectAssignments,
  projectMembers,
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
  type ProjectMember,
  type InsertProjectMember,
  type ProjectsApiQueryParams,
  type TasksApiQueryParams,
  type AssignProjectMemberApi,
  type UpdateProjectApi,
  type InsertTaskApi,
  type UpdateTaskApi,
  type UpdateTaskStatusApi,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, like, or, isNull, isNotNull, ilike, count, inArray } from "drizzle-orm";
import { queryBuilder, FilterOptions, SortOptions, PaginationOptions } from "./queryBuilder";

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
  validateDailyHours(employeeId: number, date: string, totalHours: number): Promise<{ valid: boolean; errors: string[] }>;
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
  
  // Additional time entry methods
  compareTimeWithPlanning(employeeId: number, date: string): Promise<any>;
  getTimeEntriesSummary(employeeId: number, startDate: string, endDate: string): Promise<any>;
  submitWeeklyTimeEntries(employeeId: number, weekStart: string): Promise<{ submitted: number; errors: string[] }>;
  
  // Time entry validation and business logic
  validateTimeEntryOverlap(employeeId: number, date: string, startTime: string, endTime: string, excludeId?: number): Promise<{ valid: boolean; conflicts: string[] }>;
  calculateWorkingHours(startTime: string, endTime: string, breakDuration: number): number;
  calculateOvertimeHours(employeeId: number, date: string, totalHours: number): Promise<{ regularHours: number; overtimeHours: number }>;
  
  // French labor law validation methods
  validateWeeklyHours(employeeId: number, weekStart: string, totalHours: number): Promise<{ valid: boolean; errors: string[] }>;
  validateRestPeriod(employeeId: number, date: string, startTime: string): Promise<{ valid: boolean; errors: string[] }>;
  
  // Time comparison and analysis
  compareTimeWithPlanning(employeeId: number, dateFrom: string, dateTo: string): Promise<any>;
  detectTimeAnomalies(employeeId: number, dateFrom?: string, dateTo?: string): Promise<any[]>;
  getTimeEntriesSummary(employeeId?: number, period?: string): Promise<any>;

  // Notifications operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number, page?: number, limit?: number, type?: string, priority?: string): Promise<{ data: Notification[]; total: number; page: number; totalPages: number }>;
  getNotification(id: number): Promise<Notification | undefined>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;

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

  // Projects API
  getProjectsWithStats(filters?: ProjectsApiQueryParams): Promise<{ projects: any[]; total: number; page: number; totalPages: number; }>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: UpdateProjectApi): Promise<Project | undefined>;
  getProjectMembers(projectId: number): Promise<any[]>;
  assignProjectMember(projectId: number, data: AssignProjectMemberApi): Promise<ProjectMember>;
  removeProjectMember(projectId: number, employeeId: number): Promise<boolean>;

  // Tasks API
  getTasksWithFilters(filters?: TasksApiQueryParams): Promise<{ tasks: any[]; total: number; page: number; totalPages: number; }>;
  getTasksByEmployeeId(employeeId: number, filters?: Partial<TasksApiQueryParams>): Promise<{ tasks: any[]; total: number; }>;
  createTaskApi(task: InsertTaskApi): Promise<Task>;
  updateTaskApi(id: number, task: UpdateTaskApi): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: UpdateTaskStatusApi): Promise<Task | undefined>;

  // Dashboard Data
  getAdminDashboardData(): Promise<any>;
  getEmployeeDashboardData(employeeId: number): Promise<any>;
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
    // Map table columns for QueryBuilder
    const tableColumns = {
      id: employees.id,
      first_name: employees.first_name,
      last_name: employees.last_name,
      employee_number: employees.employee_number,
      department_id: employees.department_id,
      manager_id: employees.manager_id,
      hire_date: employees.hire_date,
      contract_type: employees.contract_type,
      weekly_hours: employees.weekly_hours,
      is_active: employees.is_active,
      phone: employees.phone,
      email: users.email, // From joined users table
      department_name: departments.name, // From joined departments table
      created_at: employees.created_at,
    };

    // Prepare advanced filter options
    const filterOptions: FilterOptions = {
      searchFields: ['first_name', 'last_name', 'employee_number', 'email'],
      exactMatches: [],
      dateRanges: [],
      booleanFilters: [],
    };

    // Map filters to QueryBuilder format
    if (filters?.search) {
      filterOptions.search = filters.search;
    }

    // Status mapping (active/inactive -> boolean)
    if (filters?.status) {
      const isActive = filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined;
      if (isActive !== undefined) {
        filterOptions.booleanFilters!.push({ field: 'is_active', value: isActive });
      }
    }

    // Exact match filters
    if (filters?.department) {
      filterOptions.exactMatches!.push({ field: 'department_id', value: filters.department });
    }
    if (filters?.contractType) {
      filterOptions.exactMatches!.push({ field: 'contract_type', value: filters.contractType });
    }
    if (filters?.managerId) {
      filterOptions.exactMatches!.push({ field: 'manager_id', value: filters.managerId });
    }

    // Date range filters
    if (filters?.hiredAfter || filters?.hiredBefore) {
      filterOptions.dateRanges!.push({
        field: 'hire_date',
        from: filters.hiredAfter,
        to: filters.hiredBefore,
      });
    }

    // Numeric range filters (weekly hours)
    if (filters?.minWeeklyHours !== undefined || filters?.maxWeeklyHours !== undefined) {
      if (filters.minWeeklyHours !== undefined) {
        filterOptions.dateRanges!.push({
          field: 'weekly_hours',
          from: filters.minWeeklyHours.toString(),
        });
      }
      if (filters.maxWeeklyHours !== undefined) {
        filterOptions.dateRanges!.push({
          field: 'weekly_hours',
          to: filters.maxWeeklyHours.toString(),
        });
      }
    }

    // Boolean filters for email/phone presence
    if (filters?.hasEmail !== undefined) {
      filterOptions.booleanFilters!.push({ 
        field: filters.hasEmail ? 'has_email' : 'no_email', 
        value: filters.hasEmail 
      });
    }
    if (filters?.hasPhone !== undefined) {
      filterOptions.booleanFilters!.push({ 
        field: filters.hasPhone ? 'has_phone' : 'no_phone', 
        value: filters.hasPhone 
      });
    }

    // Prepare sort options
    const sortOptions: SortOptions = {
      sortBy: filters?.sortBy || 'created_at',
      sortOrder: (filters?.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Handle special sorting cases
    if (filters?.sortBy === 'name') {
      sortOptions.multiSort = [
        { field: 'last_name', direction: sortOptions.sortOrder! },
        { field: 'first_name', direction: sortOptions.sortOrder! }
      ];
      sortOptions.sortBy = undefined;
    } else if (filters?.sortBy === 'department') {
      sortOptions.sortBy = 'department_name';
    }

    // Prepare pagination options
    const paginationOptions: PaginationOptions = { page, limit };

    // Build base query with joins
    let baseQuery = db
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
        weeklyHours: employees.weekly_hours,
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

    // Apply filters using QueryBuilder
    baseQuery = queryBuilder.applyFilters(baseQuery, filterOptions, tableColumns);

    // Handle special boolean filters manually (hasEmail/hasPhone)
    if (filters?.hasEmail !== undefined) {
      baseQuery = baseQuery.where(
        filters.hasEmail ? isNotNull(users.email) : isNull(users.email)
      ) as typeof baseQuery;
    }
    if (filters?.hasPhone !== undefined) {
      baseQuery = baseQuery.where(
        filters.hasPhone ? isNotNull(employees.phone) : isNull(employees.phone)
      ) as typeof baseQuery;
    }

    // Apply sorting using QueryBuilder
    baseQuery = queryBuilder.applySort(baseQuery, sortOptions, tableColumns);

    // Apply pagination using QueryBuilder
    const query = queryBuilder.applyPagination(baseQuery, paginationOptions);

    // Build count query
    let countQuery = db
      .select({ count: count() })
      .from(employees)
      .leftJoin(users, eq(employees.user_id, users.id))
      .leftJoin(departments, eq(employees.department_id, departments.id));

    // Apply same filters to count query
    countQuery = queryBuilder.applyFilters(countQuery, filterOptions, tableColumns);
    
    // Handle special boolean filters for count query
    if (filters?.hasEmail !== undefined) {
      countQuery = countQuery.where(
        filters.hasEmail ? isNotNull(users.email) : isNull(users.email)
      ) as typeof countQuery;
    }
    if (filters?.hasPhone !== undefined) {
      countQuery = countQuery.where(
        filters.hasPhone ? isNotNull(employees.phone) : isNull(employees.phone)
      ) as typeof countQuery;
    }

    // Execute both queries in parallel
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
      category?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      limit?: number;
      offset?: number;
      page?: number;
    }
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number; }> {
    // Map table columns for QueryBuilder
    const tableColumns = {
      id: timeEntries.id,
      employee_id: timeEntries.employee_id,
      project_id: timeEntries.project_id,
      date: timeEntries.date,
      start_time: timeEntries.start_time,
      end_time: timeEntries.end_time,
      type: timeEntries.type,
      category: timeEntries.category,
      description: timeEntries.description,
      status: timeEntries.status,
      validated_by: timeEntries.validated_by,
      validated_at: timeEntries.validated_at,
      created_at: timeEntries.created_at,
      updated_at: timeEntries.updated_at,
      // From joined tables
      employee_first_name: employees.first_name,
      employee_last_name: employees.last_name,
      employee_number: employees.employee_number,
      project_name: projects.name,
      project_client: projects.client_name,
    };

    // Prepare advanced filter options
    const filterOptions: FilterOptions = {
      searchFields: ['employee_first_name', 'employee_last_name', 'employee_number', 'project_name', 'description'],
      exactMatches: [],
      dateRanges: [],
      booleanFilters: [],
    };

    // Map filters to QueryBuilder format
    if (filters?.search) {
      filterOptions.search = filters.search;
    }

    // Exact match filters
    if (filters?.employeeId) {
      filterOptions.exactMatches!.push({ field: 'employee_id', value: filters.employeeId });
    }
    if (filters?.projectId) {
      filterOptions.exactMatches!.push({ field: 'project_id', value: filters.projectId });
    }
    if (filters?.status) {
      filterOptions.exactMatches!.push({ field: 'status', value: filters.status });
    }
    if (filters?.type) {
      filterOptions.exactMatches!.push({ field: 'type', value: filters.type });
    }
    if (filters?.category) {
      filterOptions.exactMatches!.push({ field: 'category', value: filters.category });
    }

    // Date range filters
    if (filters?.startDate || filters?.endDate) {
      filterOptions.dateRanges!.push({
        field: 'date',
        from: filters.startDate,
        to: filters.endDate,
      });
    }

    // Prepare sort options
    const sortOptions: SortOptions = {
      sortBy: filters?.sortBy || 'date',
      sortOrder: (filters?.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Handle special sorting cases
    if (filters?.sortBy === 'employee') {
      sortOptions.multiSort = [
        { field: 'employee_last_name', direction: sortOptions.sortOrder! },
        { field: 'employee_first_name', direction: sortOptions.sortOrder! }
      ];
      sortOptions.sortBy = undefined;
    } else if (filters?.sortBy === 'project') {
      sortOptions.sortBy = 'project_name';
    } else if (filters?.sortBy === 'time') {
      sortOptions.multiSort = [
        { field: 'date', direction: sortOptions.sortOrder! },
        { field: 'start_time', direction: sortOptions.sortOrder! }
      ];
      sortOptions.sortBy = undefined;
    }

    // Prepare pagination options
    const limit = filters?.limit || 20;
    const page = filters?.page || Math.floor((filters?.offset || 0) / limit) + 1;
    const paginationOptions: PaginationOptions = { page, limit };

    // Build base query with joins
    let baseQuery = db
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
        breakDuration: timeEntries.break_duration,
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

    // Apply filters using QueryBuilder
    baseQuery = queryBuilder.applyFilters(baseQuery, filterOptions, tableColumns);

    // Apply sorting using QueryBuilder
    baseQuery = queryBuilder.applySort(baseQuery, sortOptions, tableColumns);

    // Apply pagination using QueryBuilder
    const query = queryBuilder.applyPagination(baseQuery, paginationOptions);

    // Build count query
    let countQuery = db
      .select({ count: count() })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employee_id, employees.id))
      .leftJoin(projects, eq(timeEntries.project_id, projects.id));

    // Apply same filters to count query
    countQuery = queryBuilder.applyFilters(countQuery, filterOptions, tableColumns);

    // Execute both queries in parallel
    const [timeEntriesResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: timeEntriesResult,
      total,
      page,
      totalPages,
    };
  }




  // ========================================
  // PLANNING OPERATIONS (ADVANCED)
  // ========================================
  
  async getPlanningEntriesAdvanced(filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: number;
    departmentId?: number;
    status?: string;
    type?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    offset?: number;
    page?: number;
  }): Promise<{ data: any[]; total: number; page: number; totalPages: number; }> {
    // Map table columns for QueryBuilder
    const tableColumns = {
      id: planningEntries.id,
      employee_id: planningEntries.employee_id,
      date: planningEntries.date,
      type: planningEntries.type,
      start_time: planningEntries.start_time,
      end_time: planningEntries.end_time,
      status: planningEntries.status,
      validated_by: planningEntries.validated_by,
      validated_at: planningEntries.validated_at,
      created_at: planningEntries.created_at,
      updated_at: planningEntries.updated_at,
      // From joined tables
      employee_first_name: employees.first_name,
      employee_last_name: employees.last_name,
      employee_number: employees.employee_number,
      department_id: employees.department_id,
      department_name: departments.name,
    };

    // Prepare advanced filter options
    const filterOptions: FilterOptions = {
      searchFields: ['employee_first_name', 'employee_last_name', 'employee_number'],
      exactMatches: [],
      dateRanges: [],
      booleanFilters: [],
    };

    // Map filters to QueryBuilder format
    if (filters?.search) {
      filterOptions.search = filters.search;
    }

    // Exact match filters
    if (filters?.employeeId) {
      filterOptions.exactMatches!.push({ field: 'employee_id', value: filters.employeeId });
    }
    if (filters?.departmentId) {
      filterOptions.exactMatches!.push({ field: 'department_id', value: filters.departmentId });
    }
    if (filters?.status) {
      filterOptions.exactMatches!.push({ field: 'status', value: filters.status });
    }
    if (filters?.type) {
      filterOptions.exactMatches!.push({ field: 'type', value: filters.type });
    }

    // Date range filters
    if (filters?.startDate || filters?.endDate) {
      filterOptions.dateRanges!.push({
        field: 'date',
        from: filters.startDate,
        to: filters.endDate,
      });
    }

    // Prepare sort options
    const sortOptions: SortOptions = {
      sortBy: filters?.sortBy || 'date',
      sortOrder: (filters?.sortOrder as 'asc' | 'desc') || 'asc',
    };

    // Handle special sorting cases
    if (filters?.sortBy === 'employee') {
      sortOptions.multiSort = [
        { field: 'employee_last_name', direction: sortOptions.sortOrder! },
        { field: 'employee_first_name', direction: sortOptions.sortOrder! }
      ];
      sortOptions.sortBy = undefined;
    } else if (filters?.sortBy === 'department') {
      sortOptions.sortBy = 'department_name';
    }

    // Prepare pagination options
    const limit = filters?.limit || 20;
    const page = filters?.page || Math.floor((filters?.offset || 0) / limit) + 1;
    const paginationOptions: PaginationOptions = { page, limit };

    // Build base query with joins
    let baseQuery = db
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
      .leftJoin(departments, eq(employees.department_id, departments.id));

    // Apply filters using QueryBuilder
    baseQuery = queryBuilder.applyFilters(baseQuery, filterOptions, tableColumns);

    // Apply sorting using QueryBuilder
    baseQuery = queryBuilder.applySort(baseQuery, sortOptions, tableColumns);

    // Apply pagination using QueryBuilder
    const query = queryBuilder.applyPagination(baseQuery, paginationOptions);

    // Build count query
    let countQuery = db
      .select({ count: count() })
      .from(planningEntries)
      .leftJoin(employees, eq(planningEntries.employee_id, employees.id))
      .leftJoin(departments, eq(employees.department_id, departments.id));

    // Apply same filters to count query
    countQuery = queryBuilder.applyFilters(countQuery, filterOptions, tableColumns);

    // Execute both queries in parallel
    const [planningResult, countResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: planningResult,
      total,
      page,
      totalPages,
    };
  }

  async getPlanningEntriesGroupedByDay(filters: {
    startDate: string;
    endDate: string;
    employeeId?: number;
    departmentId?: number;
  }): Promise<any> {
    const entries = await this.getPlanningEntries(filters);
    
    // Grouper par jour et calculer les totaux
    const groupedByDay = entries.reduce((acc, entry) => {
      const dateKey = entry.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          entries: [],
          totalPlannedHours: 0,
          workEntries: 0,
          leaveEntries: 0,
          validationStatus: 'pending'
        };
      }
      
      acc[dateKey].entries.push(entry);
      
      if (entry.type === 'work' && entry.startTime && entry.endTime) {
        const start = new Date(`1970-01-01T${entry.startTime}:00`);
        const end = new Date(`1970-01-01T${entry.endTime}:00`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        acc[dateKey].totalPlannedHours += hours;
        acc[dateKey].workEntries++;
      } else if (entry.type !== 'work') {
        acc[dateKey].leaveEntries++;
      }
      
      // Déterminer le statut de validation (prendre le plus restrictif)
      if (entry.status === 'rejected') {
        acc[dateKey].validationStatus = 'rejected';
      } else if (entry.status === 'validated' && acc[dateKey].validationStatus !== 'rejected') {
        acc[dateKey].validationStatus = 'validated';
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groupedByDay).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }

  async getEmployeeWeeklyPlanning(employeeId: number, weekStart: string): Promise<any> {
    // Calculer la fin de semaine
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split('T')[0];

    // Récupérer les entrées de planning
    const planningEntries = await this.getPlanningEntries({
      startDate: weekStart,
      endDate: weekEnd,
      employeeId
    });

    // Récupérer les temps réalisés pour comparaison
    const timeEntries = await db
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
      .orderBy(asc(timeEntries.date), asc(timeEntries.start_time));

    // Récupérer le statut de validation
    const [validation] = await db
      .select()
      .from(validations)
      .where(
        and(
          eq(validations.employee_id, employeeId),
          eq(validations.week_start_date_date, weekStart)
        )
      );

    // Calculer les totaux
    let plannedHours = 0;
    let actualHours = 0;

    planningEntries.forEach(entry => {
      if (entry.type === 'work' && entry.startTime && entry.endTime) {
        const start = new Date(`1970-01-01T${entry.startTime}:00`);
        const end = new Date(`1970-01-01T${entry.endTime}:00`);
        plannedHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    timeEntries.forEach(entry => {
      actualHours += entry.actualHours || 0;
    });

    return {
      employeeId,
      weekStart,
      weekEnd,
      planningEntries,
      timeEntries,
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
          eq(validations.week_start_date_date, weekStart)
        )
      );
    return validation || undefined;
  }

  async updateValidation(id: number, data: Partial<InsertValidation>): Promise<Validation | undefined> {
    const [updatedValidation] = await db
      .update(validations)
      .set({ ...data, updated_at: new Date() })
      .where(eq(validations.id, id))
      .returning();
    return updatedValidation || undefined;
  }

  // ========================================
  // NOTIFICATIONS OPERATIONS 
  // ========================================
  
  async getNotifications(
    userId: number, 
    page: number = 1, 
    limit: number = 20, 
    type?: string, 
    priority?: string
  ): Promise<{ data: Notification[]; total: number; page: number; totalPages: number; }> {
    const offset = (page - 1) * limit;
    const conditions = [eq(notifications.user_id, userId)];
    
    if (type) {
      conditions.push(eq(notifications.type, type as any));
    }
    if (priority) {
      conditions.push(eq(notifications.priority, priority as any));
    }

    const [notificationList, totalCountResult] = await Promise.all([
      db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.created_at))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions))
    ]);

    const total = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: notificationList,
      total,
      page,
      totalPages
    };
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.user_id, userId),
        eq(notifications.is_read, false)
      ));
    return result?.count || 0;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [updated] = await db
      .update(notifications)
      .set({ 
        is_read: true, 
        read_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return !!updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        is_read: true, 
        read_at: new Date(),
        updated_at: new Date()
      })
      .where(and(
        eq(notifications.user_id, userId),
        eq(notifications.is_read, false)
      ));
    
    return result.rowCount || 0;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getNotificationsByUser(
    userId: number, 
    filters?: { page?: number; limit?: number; type?: string; read?: boolean; }
  ): Promise<{ notifications: Notification[]; total: number; }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const conditions = [eq(notifications.user_id, userId)];
    
    if (filters?.type) {
      conditions.push(eq(notifications.type, filters.type as any));
    }
    if (filters?.read !== undefined) {
      conditions.push(eq(notifications.is_read, filters.read));
    }

    const [notificationList, totalCountResult] = await Promise.all([
      db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.created_at))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(...conditions))
    ]);

    const total = totalCountResult[0]?.count || 0;

    return {
      notifications: notificationList,
      total
    };
  }

  // ========================================
  // TIME ENTRIES
  // ========================================

  async getTimeEntries(params: {
    employeeId?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    projectId?: number;
    taskId?: number;
    hasOvertime?: boolean;
    hasAnomalies?: boolean;
    minHours?: number;
    maxHours?: number;
    groupBy?: 'day' | 'week' | 'month';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{
    data: any[];
    totals: any;
    anomalies: any[];
  }> {
    const {
      employeeId,
      dateFrom,
      dateTo,
      status,
      projectId,
      taskId,
      hasOvertime,
      hasAnomalies,
      minHours,
      maxHours,
      groupBy = 'day',
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 20,
      offset = 0
    } = params;

    let query = db
      .select({
        id: timeEntries.id,
        employeeId: timeEntries.employee_id,
        date: timeEntries.date,
        startTime: timeEntries.start_time,
        endTime: timeEntries.end_time,
        type: timeEntries.type,
        category: timeEntries.category,
        description: timeEntries.description,
        status: timeEntries.status,
        projectId: timeEntries.project_id,
        locationLatitude: timeEntries.location_latitude,
        locationLongitude: timeEntries.location_longitude,
        locationAddress: timeEntries.location_address,
        validatedBy: timeEntries.validated_by,
        validatedAt: timeEntries.validated_at,
        createdAt: timeEntries.created_at,
        updatedAt: timeEntries.updated_at,
        employeeFirstName: employees.first_name,
        employeeLastName: employees.last_name,
        employeeNumber: employees.employee_number,
        projectName: projects.name,
      })
      .from(timeEntries)
      .leftJoin(employees, eq(timeEntries.employee_id, employees.id))
      .leftJoin(projects, eq(timeEntries.project_id, projects.id));

    const conditions: any[] = [];

    if (employeeId) conditions.push(eq(timeEntries.employee_id, employeeId));
    if (dateFrom) conditions.push(gte(timeEntries.date, dateFrom));
    if (dateTo) conditions.push(lte(timeEntries.date, dateTo));
    if (status) conditions.push(eq(timeEntries.status, status as any));
    if (projectId) conditions.push(eq(timeEntries.project_id, projectId));
    // Note: tasks table relationship needs to be implemented separately if needed

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sorting
    const orderColumn = sortBy === 'employee' ? employees.last_name :
                       sortBy === 'project' ? projects.name :
                       sortBy === 'created_at' ? timeEntries.created_at :
                       timeEntries.date;
    
    query = query.orderBy(sortOrder === 'desc' ? desc(orderColumn) : asc(orderColumn));

    // Pagination
    const data = await query.limit(limit).offset(offset);

    // Calculate totals
    const countQuery = db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(timeEntries);

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count }] = await countQuery;

    // Calculate working hours for each entry
    const dataWithCalculations = data.map(entry => {
      let workingHours = 0;
      if (entry.startTime && entry.endTime) {
        const start = new Date(`1970-01-01T${entry.startTime}:00`);
        const end = new Date(`1970-01-01T${entry.endTime}:00`);
        workingHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      
      return {
        ...entry,
        workingHours: Math.round(workingHours * 100) / 100,
        isOvertime: workingHours > 8
      };
    });

    const totalHours = dataWithCalculations.reduce((sum, entry) => sum + entry.workingHours, 0);
    const overtimeHours = dataWithCalculations
      .filter(entry => entry.isOvertime)
      .reduce((sum, entry) => sum + Math.max(0, entry.workingHours - 8), 0);

    return {
      data: dataWithCalculations,
      totals: { 
        totalHours: Math.round(totalHours * 100) / 100, 
        overtimeHours: Math.round(overtimeHours * 100) / 100, 
        count 
      },
      anomalies: [] // Will be implemented with business logic
    };
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    // Calculate total hours and overtime
    const startTime = new Date(`1970-01-01T${entry.start_time}:00`);
    const endTime = new Date(`1970-01-01T${entry.end_time}:00`);
    const breakMinutes = entry.break_duration || 0;
    
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60) - breakMinutes;
    const totalHours = Math.max(0, totalMinutes / 60);
    
    // Calculate overtime (over 8 hours per day)
    const standardHours = 8;
    const overtimeHours = Math.max(0, totalHours - standardHours);

    const entryWithCalculations = {
      ...entry,
      total_hours: totalHours,
      overtime_hours: overtimeHours,
      is_overtime: overtimeHours > 0 || entry.is_overtime || false,
      status: 'draft' as const,
    };

    const [newEntry] = await db
      .insert(timeEntries)
      .values(entryWithCalculations)
      .returning();

    return newEntry;
  }

  async updateTimeEntry(id: number, data: Partial<InsertTimeEntry>): Promise<TimeEntry | undefined> {
    // Recalculate if time fields are updated
    let updateData = { ...data };
    
    if (data.start_time || data.end_time || data.break_duration !== undefined) {
      const currentEntry = await this.getTimeEntry(id);
      if (!currentEntry) return undefined;

      const startTime = data.start_time || currentEntry.start_time;
      const endTime = data.end_time || currentEntry.end_time;
      const breakMinutes = data.break_duration !== undefined ? data.break_duration : currentEntry.break_duration;

      const startTimeDate = new Date(`1970-01-01T${startTime}:00`);
      const endTimeDate = new Date(`1970-01-01T${endTime}:00`);
      
      const totalMinutes = (endTimeDate.getTime() - startTimeDate.getTime()) / (1000 * 60) - breakMinutes;
      const totalHours = Math.max(0, totalMinutes / 60);
      
      const standardHours = 8;
      const overtimeHours = Math.max(0, totalHours - standardHours);

      updateData = {
        ...updateData,
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        is_overtime: overtimeHours > 0 || data.is_overtime || false,
      };
    }

    const [updatedEntry] = await db
      .update(timeEntries)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(timeEntries.id, id))
      .returning();

    return updatedEntry || undefined;
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id));
    return entry || undefined;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    const result = await db
      .delete(timeEntries)
      .where(eq(timeEntries.id, id));
    return result.rowCount > 0;
  }

  async bulkCreateTimeEntries(entries: InsertTimeEntry[]): Promise<TimeEntry[]> {
    const entriesWithCalculations = entries.map(entry => {
      const startTime = new Date(`1970-01-01T${entry.start_time}:00`);
      const endTime = new Date(`1970-01-01T${entry.end_time}:00`);
      const breakMinutes = entry.break_duration || 0;
      
      const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60) - breakMinutes;
      const totalHours = Math.max(0, totalMinutes / 60);
      
      const standardHours = 8;
      const overtimeHours = Math.max(0, totalHours - standardHours);

      return {
        ...entry,
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        is_overtime: overtimeHours > 0 || entry.is_overtime || false,
        status: 'draft' as const,
      };
    });

    const newEntries = await db
      .insert(timeEntries)
      .values(entriesWithCalculations)
      .returning();

    return newEntries;
  }

  async detectTimeAnomalies(employeeId: number, dateFrom: string, dateTo: string): Promise<any[]> {
    const entries = await this.getTimeEntries({
      employeeId,
      dateFrom,
      dateTo,
      limit: 1000,
      offset: 0
    });

    const anomalies: any[] = [];

    // Group by date for daily analysis
    const dailyEntries: Record<string, any[]> = {};
    entries.data.forEach(entry => {
      if (!dailyEntries[entry.date]) dailyEntries[entry.date] = [];
      dailyEntries[entry.date].push(entry);
    });

    // Detect anomalies
    for (const [date, dayEntries] of Object.entries(dailyEntries)) {
      const totalHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
      
      // Check for excessive daily hours
      if (totalHours > 10) {
        anomalies.push({
          type: 'excessive_daily_hours',
          severity: 'error',
          employeeId,
          date,
          description: `Dépassement de 10h journalières: ${totalHours.toFixed(2)}h`,
          entries: dayEntries.map(e => e.id)
        });
      }

      // Check for missing breaks (if over 6 hours without break)
      const hasLongEntry = dayEntries.some(entry => {
        const hours = entry.totalHours || 0;
        const breakDuration = entry.breakDuration || 0;
        return hours > 6 && breakDuration < 30; // Less than 30min break for 6+ hour work
      });

      if (hasLongEntry) {
        anomalies.push({
          type: 'missing_break',
          severity: 'warning',
          employeeId,
          date,
          description: 'Pause manquante pour une journée de plus de 6h',
          entries: dayEntries.filter(e => (e.totalHours || 0) > 6 && (e.breakDuration || 0) < 30).map(e => e.id)
        });
      }

      // Check for overlapping entries
      for (let i = 0; i < dayEntries.length - 1; i++) {
        for (let j = i + 1; j < dayEntries.length; j++) {
          const entry1 = dayEntries[i];
          const entry2 = dayEntries[j];
          
          const start1 = new Date(`1970-01-01T${entry1.startTime}:00`);
          const end1 = new Date(`1970-01-01T${entry1.endTime}:00`);
          const start2 = new Date(`1970-01-01T${entry2.startTime}:00`);
          const end2 = new Date(`1970-01-01T${entry2.endTime}:00`);

          if ((start1 < end2 && end1 > start2)) {
            anomalies.push({
              type: 'overlapping_entries',
              severity: 'error',
              employeeId,
              date,
              description: `Chevauchement entre ${entry1.startTime}-${entry1.endTime} et ${entry2.startTime}-${entry2.endTime}`,
              entries: [entry1.id, entry2.id]
            });
          }
        }
      }
    }

    return anomalies;
  }

  async submitTimeEntries(employeeId: number, weekStartDate: string): Promise<{
    success: boolean;
    submittedCount: number;
    anomalies: any[];
    message: string;
  }> {
    // Calculate week end date
    const weekStart = new Date(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekEndDate = weekEnd.toISOString().split('T')[0];

    // Get all draft entries for the week
    const entries = await this.getTimeEntries({
      employeeId,
      dateFrom: weekStartDate,
      dateTo: weekEndDate,
      status: 'draft',
      limit: 100,
      offset: 0
    });

    if (entries.data.length === 0) {
      return {
        success: false,
        submittedCount: 0,
        anomalies: [],
        message: 'Aucune entrée de temps en brouillon trouvée pour cette semaine'
      };
    }

    // Detect anomalies before submission
    const anomalies = await this.detectTimeAnomalies(employeeId, weekStartDate, weekEndDate);

    // Check for critical anomalies that prevent submission
    const criticalAnomalies = anomalies.filter(a => a.severity === 'error');
    if (criticalAnomalies.length > 0) {
      return {
        success: false,
        submittedCount: 0,
        anomalies,
        message: `Impossible de soumettre: ${criticalAnomalies.length} anomalie(s) critique(s) détectée(s)`
      };
    }

    // Update all entries to submitted status
    await db
      .update(timeEntries)
      .set({ status: 'submitted', updated_at: new Date() })
      .where(
        and(
          eq(timeEntries.employee_id, employeeId),
          gte(timeEntries.date, weekStartDate),
          lte(timeEntries.date, weekEndDate),
          eq(timeEntries.status, 'draft')
        )
      );

    return {
      success: true,
      submittedCount: entries.data.length,
      anomalies,
      message: `${entries.data.length} entrée(s) soumise(s) avec succès`
    };
  }

  async getCurrentDayTimeEntries(employeeId: number): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.getTimeEntries({
      employeeId,
      dateFrom: today,
      dateTo: today,
      limit: 50,
      offset: 0
    });
    return result.data;
  }

  async validateTimeEntryOverlap(
    employeeId: number, 
    date: string, 
    startTime: string, 
    endTime: string, 
    excludeId?: number
  ): Promise<{ valid: boolean; conflicts: string[] }> {
    const existingEntries = await this.getTimeEntries({
      employeeId,
      dateFrom: date,
      dateTo: date,
      limit: 100,
      offset: 0
    });

    const conflicts: string[] = [];
    const newStart = new Date(`1970-01-01T${startTime}:00`);
    const newEnd = new Date(`1970-01-01T${endTime}:00`);

    for (const entry of existingEntries.data) {
      if (excludeId && entry.id === excludeId) continue;
      
      const existingStart = new Date(`1970-01-01T${entry.startTime}:00`);
      const existingEnd = new Date(`1970-01-01T${entry.endTime}:00`);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push(`Overlaps with entry ${entry.id} (${entry.startTime}-${entry.endTime})`);
      }
    }

    return {
      valid: conflicts.length === 0,
      conflicts
    };
  }

  calculateWorkingHours(startTime: string, endTime: string, breakDuration: number = 0): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakDuration / 60)); // breakDuration en minutes
  }

  async calculateOvertimeHours(
    employeeId: number, 
    date: string, 
    totalHours: number
  ): Promise<{ regularHours: number; overtimeHours: number }> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) {
      return { regularHours: totalHours, overtimeHours: 0 };
    }

    // French law: max 10h/day, 35h/week standard
    const maxDailyHours = 10;
    const standardDailyHours = employee.weekly_hours / 5; // Assume 5-day work week

    let regularHours = Math.min(totalHours, standardDailyHours);
    let overtimeHours = Math.max(0, totalHours - standardDailyHours);

    // Cap at legal maximum
    if (totalHours > maxDailyHours) {
      regularHours = Math.min(regularHours, maxDailyHours);
      overtimeHours = Math.min(overtimeHours, maxDailyHours - regularHours);
    }

    return { regularHours, overtimeHours };
  }

  async validateDailyHours(
    employeeId: number, 
    date: string, 
    totalHours: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const maxDailyHours = 10; // French labor law

    if (totalHours > maxDailyHours) {
      errors.push(`Maximum daily hours exceeded: ${totalHours}h > ${maxDailyHours}h`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async validateWeeklyHours(
    employeeId: number, 
    weekStart: string, 
    additionalHours: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const maxWeeklyHours = 48; // French labor law
    
    // Get existing hours for the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const existingEntries = await this.getTimeEntries({
      employeeId,
      dateFrom: weekStart,
      dateTo: weekEnd.toISOString().split('T')[0],
      limit: 100,
      offset: 0
    });

    const currentWeeklyHours = existingEntries.data.reduce((total, entry) => {
      if (entry.endTime) {
        return total + this.calculateWorkingHours(entry.startTime, entry.endTime, entry.breakDuration || 0);
      }
      return total;
    }, 0);

    const totalWeeklyHours = currentWeeklyHours + additionalHours;

    if (totalWeeklyHours > maxWeeklyHours) {
      errors.push(`Maximum weekly hours exceeded: ${totalWeeklyHours}h > ${maxWeeklyHours}h`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async validateRestPeriod(
    employeeId: number, 
    date: string, 
    startTime: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const minRestHours = 11; // French labor law: 11h rest between shifts

    // Get previous day's last entry
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    
    const previousEntries = await this.getTimeEntries({
      employeeId,
      dateFrom: previousDate.toISOString().split('T')[0],
      dateTo: previousDate.toISOString().split('T')[0],
      limit: 50,
      offset: 0
    });

    if (previousEntries.data.length > 0) {
      // Find the latest end time from previous day
      const lastEntry = previousEntries.data
        .filter(entry => entry.endTime)
        .sort((a, b) => b.endTime.localeCompare(a.endTime))[0];

      if (lastEntry) {
        const lastEndTime = new Date(`${previousDate.toISOString().split('T')[0]}T${lastEntry.endTime}:00`);
        const currentStartTime = new Date(`${date}T${startTime}:00`);
        
        const restHours = (currentStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);
        
        if (restHours < minRestHours) {
          errors.push(`Insufficient rest period: ${restHours.toFixed(1)}h < ${minRestHours}h required`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculateWorkingHours(startTime: string, endTime: string, breakDuration: number = 0): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - (breakDuration / 60)); // breakDuration en minutes
  }

  async calculateOvertimeHours(
    employeeId: number, 
    date: string, 
    totalHours: number
  ): Promise<{ regularHours: number; overtimeHours: number }> {
    const employee = await this.getEmployee(employeeId);
    if (!employee) {
      return { regularHours: totalHours, overtimeHours: 0 };
    }

    // French law: max 10h/day, 35h/week standard
    const maxDailyHours = 10;
    const standardDailyHours = employee.weekly_hours / 5; // Assume 5-day work week

    let regularHours = Math.min(totalHours, standardDailyHours);
    let overtimeHours = Math.max(0, totalHours - standardDailyHours);

    // Cap at legal maximum
    if (totalHours > maxDailyHours) {
      regularHours = Math.min(regularHours, maxDailyHours);
      overtimeHours = Math.min(overtimeHours, maxDailyHours - regularHours);
    }

    return { regularHours, overtimeHours };
  }

  async validateDailyHours(
    employeeId: number, 
    date: string, 
    totalHours: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const maxDailyHours = 10; // French labor law

    if (totalHours > maxDailyHours) {
      errors.push(`Maximum daily hours exceeded: ${totalHours}h > ${maxDailyHours}h`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async validateWeeklyHours(
    employeeId: number, 
    weekStart: string, 
    additionalHours: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const maxWeeklyHours = 48; // French labor law
    
    // Get existing hours for the week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const existingEntries = await this.getTimeEntries({
      employeeId,
      dateFrom: weekStart,
      dateTo: weekEnd.toISOString().split('T')[0],
      limit: 100,
      offset: 0
    });

    const currentWeeklyHours = existingEntries.data.reduce((total, entry) => {
      if (entry.endTime) {
        return total + this.calculateWorkingHours(entry.startTime, entry.endTime, entry.breakDuration || 0);
      }
      return total;
    }, 0);

    const totalWeeklyHours = currentWeeklyHours + additionalHours;

    if (totalWeeklyHours > maxWeeklyHours) {
      errors.push(`Maximum weekly hours exceeded: ${totalWeeklyHours}h > ${maxWeeklyHours}h`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async validateRestPeriod(
    employeeId: number, 
    date: string, 
    startTime: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const minRestHours = 11; // French labor law: 11h rest between shifts

    // Get previous day's last entry
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    
    const previousEntries = await this.getTimeEntries({
      employeeId,
      dateFrom: previousDate.toISOString().split('T')[0],
      dateTo: previousDate.toISOString().split('T')[0],
      limit: 50,
      offset: 0
    });

    if (previousEntries.data.length > 0) {
      // Find the latest end time from previous day
      const lastEntry = previousEntries.data
        .filter(entry => entry.endTime)
        .sort((a, b) => b.endTime.localeCompare(a.endTime))[0];

      if (lastEntry) {
        const lastEndTime = new Date(`${previousDate.toISOString().split('T')[0]}T${lastEntry.endTime}:00`);
        const currentStartTime = new Date(`${date}T${startTime}:00`);
        
        const restHours = (currentStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);
        
        if (restHours < minRestHours) {
          errors.push(`Insufficient rest period: ${restHours.toFixed(1)}h < ${minRestHours}h required`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return created;
  }

  async getNotifications(params: {
    userId: number;
    type?: string;
    priority?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Notification[]; total: number }> {
    const { userId, type, priority, isRead, limit = 20, offset = 0 } = params;

    const conditions: any[] = [eq(notifications.user_id, userId)];
    
    if (type) conditions.push(eq(notifications.type, type as any));
    if (priority) conditions.push(eq(notifications.priority, priority as any));
    if (isRead !== undefined) conditions.push(eq(notifications.is_read, isRead));

    let query = db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.created_at));

    const data = await query.limit(limit).offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(...conditions));

    return { data, total: count };
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    const [updated] = await db
      .update(notifications)
      .set({ 
        is_read: true, 
        read_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return !!updated;
  }

  async markAllNotificationsAsRead(userId: number): Promise<number> {
    const result = await db
      .update(notifications)
      .set({ 
        is_read: true, 
        read_at: new Date(),
        updated_at: new Date()
      })
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.is_read, false)
        )
      );
    
    return result.rowCount || 0;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.user_id, userId),
          eq(notifications.is_read, false)
        )
      );
    
    return count;
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId))
      .returning();
    
    return !!deleted;
  }

  // Notifications - remove duplicates, keeping the first implementation above

  async getNotificationsByUser(
    userId: number, 
    filters?: { page?: number; limit?: number; type?: string; read?: boolean }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    
    const whereConditions = [eq(notifications.user_id, userId)];
    
    if (filters?.type) {
      whereConditions.push(eq(notifications.type, filters.type as any));
    }
    
    if (filters?.read !== undefined) {
      whereConditions.push(eq(notifications.is_read, filters.read));
    }

    const [data, totalResult] = await Promise.all([
      db.select()
        .from(notifications)
        .where(and(...whereConditions))
        .orderBy(desc(notifications.created_at))
        .limit(limit)
        .offset(offset),
      
      db.select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(...whereConditions))
    ]);

    return {
      notifications: data,
      total: totalResult[0]?.count || 0
    };
  }

  // ========================================
  // PLANNING GENERATION
  // ========================================

  async generatePlanning(params: {
    employeeIds: number[];
    startDate: string;
    endDate: string;
    templateId?: number;
    respectConstraints?: boolean;
  }): Promise<{
    generatedEntries: PlanningEntry[];
    conflicts: any[];
    warnings: string[];
  }> {
    const { employeeIds, startDate, endDate, respectConstraints = true } = params;
    const generatedEntries: PlanningEntry[] = [];
    const conflicts: any[] = [];
    const warnings: string[] = [];

    // Logique de génération simple (peut être étendue)
    for (const employeeId of employeeIds) {
      // Récupérer les informations de l'employé
      const employee = await this.getEmployee(employeeId);
      if (!employee || !employee.is_active) {
        warnings.push(`Employé ${employeeId} non trouvé ou inactif`);
        continue;
      }

      // Générer des créneaux par défaut (8h par jour, 5 jours par semaine)
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);

      while (currentDate <= endDateObj) {
        const dayOfWeek = currentDate.getDay();
        
        // Lundi à vendredi seulement
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          const entry = {
            employee_id: employeeId,
            date: dateStr,
            type: 'work' as const,
            start_time: '09:00',
            end_time: '17:00',
            status: 'draft' as const,
            created_at: new Date(),
            updated_at: new Date(),
          };

          // Vérifier les contraintes si demandé
          if (respectConstraints) {
            const { valid, conflicts: entryConflicts } = await import('./businessLogic').then(bl => 
              bl.checkLegalConstraints(employeeId, dateStr, '09:00', '17:00')
            );
            
            if (!valid) {
              conflicts.push(...entryConflicts);
            } else {
              const createdEntry = await this.createPlanningEntry(entry);
              generatedEntries.push(createdEntry);
            }
          } else {
            const createdEntry = await this.createPlanningEntry(entry);
            generatedEntries.push(createdEntry);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return {
      generatedEntries,
      conflicts,
      warnings
    };
  }

  // ========================================
  // PROJECTS API OPERATIONS
  // ========================================
  async getProjectsWithStats(filters: ProjectsApiQueryParams = {}): Promise<{ projects: any[]; total: number; page: number; totalPages: number; }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let baseQuery = db
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
        creator_name: sql<string>`CONCAT(${employees.first_name}, ' ', ${employees.last_name})`,
        tasks_count: sql<number>`COUNT(DISTINCT ${tasks.id})`,
        active_tasks: sql<number>`COUNT(DISTINCT CASE WHEN ${tasks.status} IN ('todo', 'in_progress') THEN ${tasks.id} END)`,
        members_count: sql<number>`COUNT(DISTINCT ${projectMembers.employee_id})`
      })
      .from(projects)
      .leftJoin(employees, eq(projects.created_by, employees.id))
      .leftJoin(tasks, eq(projects.id, tasks.project_id))
      .leftJoin(projectMembers, eq(projects.id, projectMembers.project_id));

    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(projects.status, filters.status));
    }
    
    if (filters.client_name) {
      conditions.push(ilike(projects.client_name, `%${filters.client_name}%`));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(projects.name, `%${filters.search}%`),
          ilike(projects.description, `%${filters.search}%`),
          ilike(projects.client_name, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    baseQuery = baseQuery.groupBy(projects.id, employees.first_name, employees.last_name);

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    
    if (sortBy === 'name') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(projects.name) : desc(projects.name));
    } else if (sortBy === 'status') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(projects.status) : desc(projects.status));
    } else if (sortBy === 'client_name') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(projects.client_name) : desc(projects.client_name));
    } else {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(projects.created_at) : desc(projects.created_at));
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(projects)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const [{ count: total }] = await countQuery;
    
    // Get paginated results
    const projectsData = await baseQuery.limit(limit).offset(offset);

    return {
      projects: projectsData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: number, project: UpdateProjectApi): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject || undefined;
  }

  async getProjectMembers(projectId: number): Promise<any[]> {
    return await db
      .select({
        id: projectMembers.id,
        project_id: projectMembers.project_id,
        employee_id: projectMembers.employee_id,
        role: projectMembers.role,
        assigned_at: projectMembers.assigned_at,
        hourly_rate: projectMembers.hourly_rate,
        employee_name: sql<string>`CONCAT(${employees.first_name}, ' ', ${employees.last_name})`,
        employee_email: users.email,
        department_name: departments.name
      })
      .from(projectMembers)
      .leftJoin(employees, eq(projectMembers.employee_id, employees.id))
      .leftJoin(users, eq(employees.user_id, users.id))
      .leftJoin(departments, eq(employees.department_id, departments.id))
      .where(eq(projectMembers.project_id, projectId))
      .orderBy(asc(employees.last_name));
  }

  async assignProjectMember(projectId: number, data: AssignProjectMemberApi): Promise<ProjectMember> {
    const [member] = await db
      .insert(projectMembers)
      .values({
        project_id: projectId,
        employee_id: data.employee_id,
        role: data.role || 'developer',
        hourly_rate: data.hourly_rate?.toString() || null
      })
      .returning();
    return member;
  }

  async removeProjectMember(projectId: number, employeeId: number): Promise<boolean> {
    const result = await db
      .delete(projectMembers)
      .where(and(
        eq(projectMembers.project_id, projectId),
        eq(projectMembers.employee_id, employeeId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // ========================================
  // TASKS API OPERATIONS
  // ========================================
  async getTasksWithFilters(filters: TasksApiQueryParams = {}): Promise<{ tasks: any[]; total: number; page: number; totalPages: number; }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let baseQuery = db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        project_id: tasks.project_id,
        assigned_to: tasks.assigned_to,
        created_by: tasks.created_by,
        status: tasks.status,
        priority: tasks.priority,
        due_date: tasks.due_date,
        estimated_hours: tasks.estimated_hours,
        actual_hours: tasks.actual_hours,
        completion_percentage: tasks.completion_percentage,
        tags: tasks.tags,
        created_at: tasks.created_at,
        updated_at: tasks.updated_at,
        project_name: projects.name,
        assignee_name: sql<string>`CONCAT(${employees.first_name}, ' ', ${employees.last_name})`,
        creator_name: sql<string>`CONCAT(creator.first_name, ' ', creator.last_name)`
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.project_id, projects.id))
      .leftJoin(employees, eq(tasks.assigned_to, employees.id))
      .leftJoin(employees.as('creator'), eq(tasks.created_by, employees.as('creator').id));

    const conditions = [];
    
    if (filters.project_id) {
      conditions.push(eq(tasks.project_id, filters.project_id));
    }
    
    if (filters.assigned_to) {
      conditions.push(eq(tasks.assigned_to, filters.assigned_to));
    }
    
    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    
    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(tasks.title, `%${filters.search}%`),
          ilike(tasks.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.tags) {
      const tagArray = filters.tags.split(',').map(tag => tag.trim());
      conditions.push(sql`${tasks.tags} && ${tagArray}`);
    }
    
    if (filters.due_date_from) {
      conditions.push(gte(tasks.due_date, filters.due_date_from));
    }
    
    if (filters.due_date_to) {
      conditions.push(lte(tasks.due_date, filters.due_date_to));
    }

    if (conditions.length > 0) {
      baseQuery = baseQuery.where(and(...conditions));
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'due_date';
    const sortOrder = filters.sortOrder || 'asc';
    
    if (sortBy === 'title') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(tasks.title) : desc(tasks.title));
    } else if (sortBy === 'status') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(tasks.status) : desc(tasks.status));
    } else if (sortBy === 'priority') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(tasks.priority) : desc(tasks.priority));
    } else if (sortBy === 'due_date') {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(tasks.due_date) : desc(tasks.due_date));
    } else {
      baseQuery = baseQuery.orderBy(sortOrder === 'asc' ? asc(tasks.created_at) : desc(tasks.created_at));
    }

    // Get total count
    const countQuery = db
      .select({ count: count() })
      .from(tasks)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const [{ count: total }] = await countQuery;
    
    // Get paginated results
    const tasksData = await baseQuery.limit(limit).offset(offset);

    return {
      tasks: tasksData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getTasksByEmployeeId(employeeId: number, filters: Partial<TasksApiQueryParams> = {}): Promise<{ tasks: any[]; total: number; }> {
    const allFilters = { ...filters, assigned_to: employeeId };
    const result = await this.getTasksWithFilters(allFilters);
    return {
      tasks: result.tasks,
      total: result.total
    };
  }

  async createTaskApi(task: InsertTaskApi): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTaskApi(id: number, task: UpdateTaskApi): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...task, updated_at: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async updateTaskStatus(id: number, statusData: UpdateTaskStatusApi): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ 
        status: statusData.status,
        completion_percentage: statusData.completion_percentage,
        actual_hours: statusData.actual_hours?.toString(),
        updated_at: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  // ========================================
  // DASHBOARD DATA OPERATIONS
  // ========================================
  async getAdminDashboardData(): Promise<any> {
    // Get basic stats
    const [employeesCount] = await db.select({ count: count() }).from(employees).where(eq(employees.is_active, true));
    const [projectsCount] = await db.select({ count: count() }).from(projects).where(eq(projects.status, 'active'));
    const [tasksCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'in_progress'));
    
    // Get projects by status
    const projectsByStatus = await db
      .select({
        status: projects.status,
        count: count()
      })
      .from(projects)
      .groupBy(projects.status);

    // Get tasks by priority
    const tasksByPriority = await db
      .select({
        priority: tasks.priority,
        count: count()
      })
      .from(tasks)
      .where(eq(tasks.status, 'todo'))
      .groupBy(tasks.priority);

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTimeEntries = await db
      .select({
        date: timeEntries.date,
        total_hours: sql<number>`SUM(${timeEntries.total_hours})`
      })
      .from(timeEntries)
      .where(gte(timeEntries.date, thirtyDaysAgo.toISOString().split('T')[0]))
      .groupBy(timeEntries.date)
      .orderBy(asc(timeEntries.date));

    return {
      stats: {
        total_employees: employeesCount.count,
        active_projects: projectsCount.count,
        active_tasks: tasksCount.count
      },
      charts: {
        projects_by_status: projectsByStatus,
        tasks_by_priority: tasksByPriority,
        time_entries_trend: recentTimeEntries
      }
    };
  }

  async getEmployeeDashboardData(employeeId: number): Promise<any> {
    // Get employee's tasks
    const myTasks = await db
      .select({
        status: tasks.status,
        count: count()
      })
      .from(tasks)
      .where(eq(tasks.assigned_to, employeeId))
      .groupBy(tasks.status);

    // Get employee's projects
    const myProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        status: projects.status,
        tasks_count: sql<number>`COUNT(${tasks.id})`
      })
      .from(projectMembers)
      .leftJoin(projects, eq(projectMembers.project_id, projects.id))
      .leftJoin(tasks, and(eq(tasks.project_id, projects.id), eq(tasks.assigned_to, employeeId)))
      .where(eq(projectMembers.employee_id, employeeId))
      .groupBy(projects.id, projects.name, projects.status);

    // Get recent time entries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTimeEntries = await db
      .select({
        date: timeEntries.date,
        total_hours: sql<number>`SUM(${timeEntries.total_hours})`
      })
      .from(timeEntries)
      .where(and(
        eq(timeEntries.employee_id, employeeId),
        gte(timeEntries.date, sevenDaysAgo.toISOString().split('T')[0])
      ))
      .groupBy(timeEntries.date)
      .orderBy(asc(timeEntries.date));

    return {
      my_tasks: myTasks,
      my_projects: myProjects,
      recent_time_entries: recentTimeEntries
    };
  }

  // ========================================
  // NOTIFICATION METHODS
  // ========================================
  
  async getNotifications(filters: {
    userId: number;
    page: number;
    limit: number;
    type?: string;
    isRead?: boolean;
    search?: string;
  }): Promise<any[]> {
    // Mock implementation - returning sample notifications
    const mockNotifications = [
      {
        id: 1,
        type: 'info',
        title: 'Nouveau planning disponible',
        message: 'Votre planning pour la semaine prochaine est maintenant disponible',
        isRead: false,
        createdAt: new Date().toISOString(),
        contextType: 'planning',
        contextId: 1,
        priority: 'medium'
      },
      {
        id: 2,
        type: 'warning',
        title: 'Heures supplémentaires détectées',
        message: 'Vous avez dépassé vos heures contractuelles cette semaine',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        contextType: 'timeentry',
        contextId: 2,
        priority: 'high'
      },
      {
        id: 3,
        type: 'success',
        title: 'Validation approuvée',
        message: 'Votre demande de congé a été approuvée par votre manager',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        contextType: 'planning',
        contextId: 3,
        priority: 'low'
      }
    ];

    return mockNotifications;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return 2; // Mock count
  }

  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    // Mock implementation - in real app would update database
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    // Mock implementation
    console.log(`Marking all notifications as read for user ${userId}`);
  }

  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    // Mock implementation
    console.log(`Deleting notification ${notificationId} for user ${userId}`);
  }

  async getNotificationPreferences(userId: number): Promise<any> {
    return {
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      digestFrequency: 'daily',
      types: {
        info: true,
        warning: true,
        error: true,
        success: true
      }
    };
  }

  async updateNotificationPreferences(userId: number, preferences: any): Promise<void> {
    // Mock implementation
    console.log(`Updating notification preferences for user ${userId}:`, preferences);
  }
}

// ============================================================================
// INSTANCE CREATION
// ============================================================================
export const storage = new DatabaseStorage();
