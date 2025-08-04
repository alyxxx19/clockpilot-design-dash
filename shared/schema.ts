import { 
  pgTable, 
  pgEnum,
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  date,
  time,
  decimal,
  json,
  jsonb,
  varchar,
  uuid,
  index,
  foreignKey
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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
// NOTIFICATIONS SYSTEM
// ============================================================================

// Notification types enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "task_assigned",
  "planning_modified", 
  "validation_required",
  "time_missing",
  "overtime_alert",
  "schedule_conflict",
  "system_update",
  "reminder"
]);

// Notification priority enum
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "medium", 
  "high",
  "urgent"
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").notNull().default("medium"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  action_url: text("action_url"),
  data: json("data"), // Additional contextual data
  is_read: boolean("is_read").default(false).notNull(),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.user_id),
  typeIdx: index("notifications_type_idx").on(table.type),
  priorityIdx: index("notifications_priority_idx").on(table.priority),
  isReadIdx: index("notifications_is_read_idx").on(table.is_read),
  createdAtIdx: index("notifications_created_at_idx").on(table.created_at),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// ============================================================================
// RELATIONS DEFINITIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.user_id],
  }),
  notifications: many(notifications),
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
// PROJECT-TASK MEMBER ASSIGNMENTS
// ============================================================================
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  employee_id: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  role: text("role", { 
    enum: ['manager', 'developer', 'designer', 'tester', 'analyst'] 
  }).notNull().default('developer'),
  assigned_at: timestamp("assigned_at").defaultNow().notNull(),
  hourly_rate: decimal("hourly_rate", { precision: 10, scale: 2 }),
}, (table) => ({
  projectIdx: index("project_members_project_idx").on(table.project_id),
  employeeIdx: index("project_members_employee_idx").on(table.employee_id),
  uniqueProjectEmployee: index("project_members_unique_idx").on(table.project_id, table.employee_id),
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
  contractType: z.enum(['CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM']).optional(),
  managerId: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  hiredAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  hiredBefore: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  minWeeklyHours: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
  maxWeeklyHours: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
  hasEmail: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  hasPhone: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sortBy: z.enum(['name', 'hire_date', 'department', 'contract_type', 'weekly_hours', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Planning API schemas
export const planningQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().int().min(1).max(100)).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional(),
  employee_id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  department_id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  status: z.enum(['draft', 'submitted', 'validated', 'rejected']).optional(),
  type: z.enum(['work', 'vacation', 'sick', 'training', 'meeting']).optional(),
  hasConflicts: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  validationStatus: z.enum(['pending', 'validated', 'rejected']).optional(),
  sortBy: z.enum(['date', 'employee', 'department', 'status', 'created_at']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const generatePlanningSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  template_id: z.number().int().positive().optional(),
  employee_ids: z.array(z.number().int().positive()).optional(),
  department_id: z.number().int().positive().optional(),
});

export const updatePlanningEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  type: z.enum(['work', 'vacation', 'sick', 'training', 'meeting']).optional(),
  status: z.enum(['draft', 'submitted', 'validated', 'rejected']).optional(),
  notes: z.string().max(500).optional(),
});

export const bulkPlanningSchema = z.object({
  entries: z.array(z.object({
    id: z.number().int().positive().optional(), // For updates
    employee_id: z.number().int().positive(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
    type: z.enum(['work', 'vacation', 'sick', 'training', 'meeting']).default('work'),
    notes: z.string().max(500).optional(),
  })).min(1).max(100), // Limit bulk operations
});

export const validatePlanningSchema = z.object({
  employee_id: z.number().int().positive(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Week start must be in YYYY-MM-DD format"),
  status: z.enum(['pending', 'validated', 'rejected']),
  comments: z.string().max(1000).optional(),
});

// Planning conflict types
export type PlanningConflict = {
  type: 'max_daily_hours' | 'max_weekly_hours' | 'insufficient_rest' | 'overlap' | 'weekly_average';
  severity: 'warning' | 'error';
  employeeId: number;
  date: string;
  description: string;
  suggestions: string[];
};

// Time entry API schemas
export const timeEntryQuerySchema = z.object({
  employee_id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date from must be in YYYY-MM-DD format").optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date to must be in YYYY-MM-DD format").optional(),
  status: z.enum(['draft', 'submitted', 'validated', 'rejected']).optional(),
  project_id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  task_id: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  hasOvertime: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  hasAnomalies: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  minHours: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
  maxHours: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0)).optional(),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
  sortBy: z.enum(['date', 'employee', 'hours', 'overtime', 'project', 'created_at']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().int().min(1).max(100)).optional(),
});

export const createTimeEntrySchema = z.object({
  employee_id: z.number().int().positive().optional(), // Optional for self-entry
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  break_duration: z.number().min(0).max(240).default(0), // Break in minutes
  project_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  is_overtime: z.boolean().default(false),
  overtime_reason: z.string().max(300).optional(),
});

export const updateTimeEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  break_duration: z.number().min(0).max(240).optional(),
  project_id: z.number().int().positive().optional(),
  task_id: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  is_overtime: z.boolean().optional(),
  overtime_reason: z.string().max(300).optional(),
});

export const bulkTimeEntriesSchema = z.object({
  entries: z.array(z.object({
    id: z.number().int().positive().optional(), // For updates
    employee_id: z.number().int().positive().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
    break_duration: z.number().min(0).max(240).default(0),
    project_id: z.number().int().positive().optional(),
    task_id: z.number().int().positive().optional(),
    description: z.string().max(500).optional(),
    location: z.string().max(200).optional(),
    is_overtime: z.boolean().default(false),
    overtime_reason: z.string().max(300).optional(),
  })).min(1).max(50), // Limit bulk operations
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Week start must be in YYYY-MM-DD format"),
});

export const submitTimeEntriesSchema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Week start date must be in YYYY-MM-DD format"),
  employee_id: z.number().int().positive().optional(), // Optional for self-submission
});

// Time comparison types
export type TimeComparison = {
  employeeId: number;
  period: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
  overtimeHours: number;
  anomalies: TimeAnomaly[];
  suggestions: string[];
};

export type TimeAnomaly = {
  type: 'no_planning' | 'large_variance' | 'missing_break' | 'overtime_without_approval' | 'location_mismatch';
  severity: 'info' | 'warning' | 'error';
  date: string;
  description: string;
  suggestion: string;
};

// ============================================================================
// NOTIFICATIONS SCHEMAS
// ============================================================================

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export const createNotificationSchema = z.object({
  user_id: z.number().int().positive(),
  type: z.enum(['task_assigned', 'planning_modified', 'validation_required', 'time_missing', 'overtime_alert', 'schedule_conflict', 'system_update', 'reminder']),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  action_url: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  data: z.record(z.any()).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().int().min(1).max(100)).optional(),
  type: z.enum(['task_assigned', 'planning_modified', 'validation_required', 'time_missing', 'overtime_alert', 'schedule_conflict', 'system_update', 'reminder']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  is_read: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sortBy: z.enum(['created_at', 'priority', 'type']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const markReadSchema = z.object({
  notification_ids: z.array(z.number().int().positive()).optional(),
  mark_all: z.boolean().default(false),
});

// Tasks API schemas
export const tasksQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).pipe(z.number().int().min(1)).optional(),
  limit: z.string().transform(val => parseInt(val) || 20).pipe(z.number().int().min(1).max(100)).optional(),
  search: z.string().optional(),
  assigneeId: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  projectId: z.string().transform(val => parseInt(val)).pipe(z.number().int().positive()).optional(),
  dueAfter: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  dueBefore: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  assignedToMe: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  overdue: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
  sortBy: z.enum(['title', 'priority', 'due_date', 'status', 'assignee', 'created_at']).default('due_date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type CreateNotification = z.infer<typeof createNotificationSchema>;

// Already exported above at line 719

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

// ============================================================================
// NEW API SCHEMAS FOR PROJECTS AND TASKS
// ============================================================================

// Projects API schemas
export const projectsApiQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).optional(),
  client_name: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const assignProjectMemberApiSchema = z.object({
  employee_id: z.number(),
  role: z.enum(['manager', 'developer', 'designer', 'tester', 'analyst']).optional(),
  hourly_rate: z.number().optional(),
});

export const updateProjectApiSchema = insertProjectSchema.partial();

// Tasks API schemas  
export const tasksApiQuerySchema = z.object({
  project_id: z.string().transform(Number).optional(),
  assigned_to: z.string().transform(Number).optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
});

export const updateTaskStatusApiSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
  completion_percentage: z.number().min(0).max(100).optional(),
  actual_hours: z.number().positive().optional(),
});

export const insertTaskApiSchema = createInsertSchema(tasks, {
  due_date: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateTaskApiSchema = insertTaskApiSchema.partial();

// Type exports for new API schemas
export type ProjectsApiQueryParams = z.infer<typeof projectsApiQuerySchema>;
export type AssignProjectMemberApi = z.infer<typeof assignProjectMemberApiSchema>;
export type UpdateProjectApi = z.infer<typeof updateProjectApiSchema>;

export type TasksApiQueryParams = z.infer<typeof tasksApiQuerySchema>;
export type UpdateTaskStatusApi = z.infer<typeof updateTaskStatusApiSchema>;
export type InsertTaskApi = z.infer<typeof insertTaskApiSchema>;
export type UpdateTaskApi = z.infer<typeof updateTaskApiSchema>;

// Project member type
export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

export const ValidationStatus = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  PARTIALLY_VALIDATED: 'partially_validated',
} as const;
