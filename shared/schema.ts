import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  date,
  time,
  decimal,
  json,
  uuid,
  index,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// ============================================================================
// DEPARTMENTS TABLE
// ============================================================================
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// USERS TABLE (Base authentication)
// ============================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ['admin', 'employee'] }).notNull().default('employee'),
});

// ============================================================================
// EMPLOYEES TABLE (Extends users with employee-specific data)
// ============================================================================
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  employee_number: text("employee_number").unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  department_id: integer("department_id").references(() => departments.id),
  manager_id: integer("manager_id"),
  hire_date: date("hire_date").notNull(),
  contract_type: text("contract_type", { 
    enum: ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM'] 
  }).notNull().default('CDI'),
  hourly_rate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  vacation_days_total: integer("vacation_days_total").notNull().default(25),
  vacation_days_used: integer("vacation_days_used").notNull().default(0),
  is_active: boolean("is_active").notNull().default(true),
  phone: text("phone"),
  address: text("address"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  departmentIdx: index("employees_department_idx").on(table.department_id),
  managerIdx: index("employees_manager_idx").on(table.manager_id),
  userIdx: index("employees_user_idx").on(table.user_id),
  managerForeignKey: foreignKey({
    columns: [table.manager_id],
    foreignColumns: [table.id],
    name: "employees_manager_fk"
  }),
}));

// ============================================================================
// PROJECTS TABLE
// ============================================================================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  client_name: text("client_name"),
  status: text("status", { 
    enum: ['active', 'completed', 'paused', 'cancelled'] 
  }).notNull().default('active'),
  start_date: date("start_date"),
  end_date: date("end_date"),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  hourly_rate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  created_by: integer("created_by").references(() => employees.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("projects_status_idx").on(table.status),
  createdByIdx: index("projects_created_by_idx").on(table.created_by),
}));

// ============================================================================
// PROJECT ASSIGNMENTS (Many-to-many relationship)
// ============================================================================
export const projectAssignments = pgTable("project_assignments", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default('member'), // lead, member, observer
  assigned_at: timestamp("assigned_at").defaultNow().notNull(),
  assigned_by: integer("assigned_by").references(() => employees.id).notNull(),
}, (table) => ({
  projectEmployeeIdx: index("project_assignments_project_employee_idx").on(table.project_id, table.employee_id),
  projectIdx: index("project_assignments_project_idx").on(table.project_id),
  employeeIdx: index("project_assignments_employee_idx").on(table.employee_id),
}));

// ============================================================================
// PLANNING ENTRIES TABLE
// ============================================================================
export const planningEntries = pgTable("planning_entries", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  type: text("type", { 
    enum: ['work', 'vacation', 'sick_leave', 'rest_day', 'training', 'meeting'] 
  }).notNull().default('work'),
  start_time: time("start_time"),
  end_time: time("end_time"),
  status: text("status", { 
    enum: ['draft', 'submitted', 'validated', 'rejected'] 
  }).notNull().default('draft'),
  validated_by: integer("validated_by").references(() => employees.id),
  validated_at: timestamp("validated_at"),
  comments: text("comments"),
  rejection_reason: text("rejection_reason"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index("planning_entries_employee_date_idx").on(table.employee_id, table.date),
  statusIdx: index("planning_entries_status_idx").on(table.status),
  typeIdx: index("planning_entries_type_idx").on(table.type),
  validatedByIdx: index("planning_entries_validated_by_idx").on(table.validated_by),
}));

// ============================================================================
// TIME ENTRIES TABLE
// ============================================================================
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  project_id: integer("project_id").references(() => projects.id),
  date: date("date").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time"),
  type: text("type", { 
    enum: ['work', 'break', 'meeting', 'training', 'overtime'] 
  }).notNull().default('work'),
  category: text("category"), // Custom categories
  description: text("description"),
  status: text("status", { 
    enum: ['draft', 'submitted', 'validated', 'rejected'] 
  }).notNull().default('draft'),
  location_latitude: decimal("location_latitude", { precision: 10, scale: 8 }),
  location_longitude: decimal("location_longitude", { precision: 11, scale: 8 }),
  location_address: text("location_address"),
  validated_by: integer("validated_by").references(() => employees.id),
  validated_at: timestamp("validated_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  employeeDateIdx: index("time_entries_employee_date_idx").on(table.employee_id, table.date),
  projectIdx: index("time_entries_project_idx").on(table.project_id),
  statusIdx: index("time_entries_status_idx").on(table.status),
  typeIdx: index("time_entries_type_idx").on(table.type),
}));

// ============================================================================
// TASKS TABLE
// ============================================================================
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  project_id: integer("project_id").references(() => projects.id),
  assigned_to: integer("assigned_to").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  created_by: integer("created_by").references(() => employees.id).notNull(),
  status: text("status", { 
    enum: ['todo', 'in_progress', 'completed', 'cancelled'] 
  }).notNull().default('todo'),
  priority: text("priority", { 
    enum: ['low', 'medium', 'high', 'urgent'] 
  }).notNull().default('medium'),
  due_date: date("due_date"),
  estimated_hours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actual_hours: decimal("actual_hours", { precision: 5, scale: 2 }),
  completion_percentage: integer("completion_percentage").default(0),
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  assignedToIdx: index("tasks_assigned_to_idx").on(table.assigned_to),
  projectIdx: index("tasks_project_idx").on(table.project_id),
  statusIdx: index("tasks_status_idx").on(table.status),
  dueDateIdx: index("tasks_due_date_idx").on(table.due_date),
}));

// ============================================================================
// SETTINGS TABLE
// ============================================================================
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  value: json("value").notNull(),
  type: text("type", { enum: ['admin', 'employee'] }).notNull().default('admin'),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }), // null for global settings
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keyIdx: index("settings_key_idx").on(table.key),
  typeIdx: index("settings_type_idx").on(table.type),
  userIdx: index("settings_user_idx").on(table.user_id),
}));

// ============================================================================
// VALIDATIONS TABLE (Weekly validation tracking)
// ============================================================================
export const validations = pgTable("validations", {
  id: serial("id").primaryKey(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  week_start_date: date("week_start_date").notNull(), // Monday of the week
  status: text("status", { 
    enum: ['pending', 'validated', 'rejected', 'partially_validated'] 
  }).notNull().default('pending'),
  validated_by: integer("validated_by").references(() => employees.id),
  validated_at: timestamp("validated_at"),
  comments: text("comments"),
  rejection_reason: text("rejection_reason"),
  total_hours: decimal("total_hours", { precision: 5, scale: 2 }),
  overtime_hours: decimal("overtime_hours", { precision: 5, scale: 2 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  employeeWeekIdx: index("validations_employee_week_idx").on(table.employee_id, table.week_start_date),
  statusIdx: index("validations_status_idx").on(table.status),
  validatedByIdx: index("validations_validated_by_idx").on(table.validated_by),
}));

// ============================================================================
// RELATIONS DEFINITIONS
// ============================================================================

export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.user_id],
  }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.user_id],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [employees.department_id],
    references: [departments.id],
  }),
  manager: one(employees, {
    fields: [employees.manager_id],
    references: [employees.id],
    relationName: "manager",
  }),
  subordinates: many(employees, {
    relationName: "manager",
  }),
  projectAssignments: many(projectAssignments),
  planningEntries: many(planningEntries),
  timeEntries: many(timeEntries),
  assignedTasks: many(tasks, {
    relationName: "assignedTo",
  }),
  createdTasks: many(tasks, {
    relationName: "createdBy",
  }),
  createdProjects: many(projects),
  validations: many(validations, {
    relationName: "employee",
  }),
  performedValidations: many(validations, {
    relationName: "validator",
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(employees, {
    fields: [projects.created_by],
    references: [employees.id],
  }),
  assignments: many(projectAssignments),
  tasks: many(tasks),
  timeEntries: many(timeEntries),
}));

export const projectAssignmentsRelations = relations(projectAssignments, ({ one }) => ({
  project: one(projects, {
    fields: [projectAssignments.project_id],
    references: [projects.id],
  }),
  employee: one(employees, {
    fields: [projectAssignments.employee_id],
    references: [employees.id],
  }),
  assignedBy: one(employees, {
    fields: [projectAssignments.assigned_by],
    references: [employees.id],
  }),
}));

export const planningEntriesRelations = relations(planningEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [planningEntries.employee_id],
    references: [employees.id],
  }),
  validator: one(employees, {
    fields: [planningEntries.validated_by],
    references: [employees.id],
  }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employee_id],
    references: [employees.id],
  }),
  project: one(projects, {
    fields: [timeEntries.project_id],
    references: [projects.id],
  }),
  validator: one(employees, {
    fields: [timeEntries.validated_by],
    references: [employees.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.project_id],
    references: [projects.id],
  }),
  assignedTo: one(employees, {
    fields: [tasks.assigned_to],
    references: [employees.id],
    relationName: "assignedTo",
  }),
  createdBy: one(employees, {
    fields: [tasks.created_by],
    references: [employees.id],
    relationName: "createdBy",
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.user_id],
    references: [users.id],
  }),
}));

export const validationsRelations = relations(validations, ({ one }) => ({
  employee: one(employees, {
    fields: [validations.employee_id],
    references: [employees.id],
    relationName: "employee",
  }),
  validator: one(employees, {
    fields: [validations.validated_by],
    references: [employees.id],
    relationName: "validator",
  }),
}));

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// Users schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const selectUserSchema = createInsertSchema(users);

// Auth schemas
export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['admin', 'employee']).default('employee'),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Employee CRUD schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  departmentId: z.number().int().positive().optional(),
  managerId: z.number().int().positive().optional(),
  employeeNumber: z.string().optional(),
  contractType: z.enum(['CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM']).default('CDI'),
  hourlyRate: z.number().positive().optional(),
  vacationDaysTotal: z.number().int().min(0).max(50).default(25),
  phone: z.string().optional(),
  address: z.string().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  isActive: z.boolean().optional(),
  vacationDaysUsed: z.number().int().min(0).optional(),
});

export const employeeQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val) || 10).pipe(z.number().int().min(1).max(100)).optional(),
  search: z.string().optional(),
  department: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  sortBy: z.enum(['name', 'hire_date', 'department', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Departments schemas
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Employees schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Projects schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Project assignments schemas
export const insertProjectAssignmentSchema = createInsertSchema(projectAssignments).omit({
  id: true,
  assigned_at: true,
});

// Planning entries schemas
export const insertPlanningEntrySchema = createInsertSchema(planningEntries).omit({
  id: true,
  created_at: true,
  updated_at: true,
  validated_at: true,
});

// Time entries schemas
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  created_at: true,
  updated_at: true,
  validated_at: true,
});

// Tasks schemas
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Validations schemas
export const insertValidationSchema = createInsertSchema(validations).omit({
  id: true,
  created_at: true,
  updated_at: true,
  validated_at: true,
});

// ============================================================================
// TYPESCRIPT TYPES (Inferred from schemas)
// ============================================================================

// Select types (from database)
export type User = typeof users.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectAssignment = typeof projectAssignments.$inferSelect;
export type PlanningEntry = typeof planningEntries.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Validation = typeof validations.$inferSelect;

// Insert types (for creating new records)
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectAssignment = z.infer<typeof insertProjectAssignmentSchema>;
export type InsertPlanningEntry = z.infer<typeof insertPlanningEntrySchema>;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type InsertValidation = z.infer<typeof insertValidationSchema>;

// ============================================================================
// ENUMS FOR FRONTEND USE
// ============================================================================

export const UserRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export const ContractType = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'STAGE',
  FREELANCE: 'FREELANCE',
  INTERIM: 'INTERIM',
} as const;

export const ProjectStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export const PlanningEntryType = {
  WORK: 'work',
  VACATION: 'vacation',
  SICK_LEAVE: 'sick_leave',
  REST_DAY: 'rest_day',
  TRAINING: 'training',
  MEETING: 'meeting',
} as const;

export const TimeEntryType = {
  WORK: 'work',
  BREAK: 'break',
  MEETING: 'meeting',
  TRAINING: 'training',
  OVERTIME: 'overtime',
} as const;

export const EntryStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
} as const;

export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const ValidationStatus = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  PARTIALLY_VALIDATED: 'partially_validated',
} as const;
