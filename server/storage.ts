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
