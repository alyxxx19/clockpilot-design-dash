import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { 
  avatarUpload, 
  logoUpload, 
  UploadService, 
  handleMulterError 
} from "./uploadMiddleware";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import path from "path";
import fs from "fs/promises";
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  planningQuerySchema,
  generatePlanningSchema,
  updatePlanningEntrySchema,
  bulkPlanningSchema,
  validatePlanningSchema,
  timeEntryQuerySchema,
  createTimeEntrySchema,
  updateTimeEntrySchema,
  bulkTimeEntriesSchema,
  submitTimeEntriesSchema,
  createNotificationSchema,
  notificationQuerySchema,
  markReadSchema,
  type User,
  type Employee,
  type Notification
} from "@shared/schema";
import { initializeNotificationService, getNotificationService } from "./notificationService";
import { ExportService } from "./exportService";

// ============================================================================
// INTERFACES
// ============================================================================
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    username: string;
  };
}

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  username: string;
  type: 'access' | 'refresh';
}

// ============================================================================
// TOKEN BLACKLIST (In production, use Redis or database)
// ============================================================================
const tokenBlacklist = new Set<string>();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const generateTokens = (user: User) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    username: user.username,
  };

  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

const getUserResponse = (user: User, employee?: Employee | null) => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    employee: employee ? {
      id: employee.id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      departmentId: employee.department_id,
      managerId: employee.manager_id,
      isActive: employee.is_active,
    } : null,
  };
};

// ============================================================================
// MIDDLEWARE
// ============================================================================
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING' 
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ 
        error: 'Token has been invalidated',
        code: 'TOKEN_BLACKLISTED' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    if (decoded.type !== 'access') {
      return res.status(401).json({ 
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE' 
      });
    }

    // Verify user still exists
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED' 
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
};

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// ============================================================================
// ROUTES IMPLEMENTATION
// ============================================================================
export async function registerRoutes(app: Express): Promise<Server> {
  
  // ========================================
  // AUTH ENDPOINTS
  // ========================================

  // POST /api/auth/register
  app.post('/api/auth/register', validateRequest(registerSchema), async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(409).json({
          error: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        });
      }

      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(409).json({
          error: 'Username already taken',
          code: 'USERNAME_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role,
      });

      // Create employee record
      let employee = null;
      try {
        employee = await storage.createEmployee({
          user_id: newUser.id,
          first_name: firstName,
          last_name: lastName,
          hire_date: new Date().toISOString().split('T')[0], // Today's date
          contract_type: 'CDI',
        });
      } catch (error) {
        console.error('Failed to create employee record:', error);
        // Continue without employee record - we'll handle this gracefully
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: getUserResponse(newUser, employee),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', validateRequest(loginSchema), async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Get employee data if exists
      let employee = null;
      try {
        employee = await storage.getEmployeeByUserId(user.id);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.json({
        message: 'Login successful',
        user: getUserResponse(user, employee),
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        // Add token to blacklist
        tokenBlacklist.add(token);
      }

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Get employee data if exists
      let employee = null;
      try {
        employee = await storage.getEmployeeByUserId(user.id);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }

      res.json({
        user: getUserResponse(user, employee)
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Failed to get user info',
        code: 'GET_USER_ERROR'
      });
    }
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', validateRequest(refreshTokenSchema), async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as JWTPayload;

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          error: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Check if user still exists
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

      res.json({
        message: 'Token refreshed successfully',
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          error: 'Refresh token expired',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      });
    }
  });

  // ========================================
  // EMPLOYEE CRUD ENDPOINTS
  // ========================================

  // GET /api/employees - List employees with pagination and filters (Admin only)
  app.get('/api/employees', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      // Validate query parameters
      const queryValidation = employeeQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: queryValidation.error.errors,
        });
      }

      const { 
        page = 1, 
        limit = 10, 
        search, 
        department, 
        status, 
        contractType,
        managerId,
        hiredAfter,
        hiredBefore,
        minWeeklyHours,
        maxWeeklyHours,
        hasEmail,
        hasPhone,
        sortBy, 
        sortOrder 
      } = queryValidation.data;

      const result = await storage.getEmployeesWithPagination(page, limit, {
        search,
        department,
        status,
        contractType,
        managerId,
        hiredAfter,
        hiredBefore,
        minWeeklyHours,
        maxWeeklyHours,
        hasEmail,
        hasPhone,
        sortBy,
        sortOrder,
      });

      res.json({
        message: 'Employees retrieved successfully',
        data: result.employees,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.page < result.totalPages,
          hasPrev: result.page > 1,
        },
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({
        error: 'Failed to fetch employees',
        code: 'FETCH_EMPLOYEES_ERROR'
      });
    }
  });

  // GET /api/employees/:id - Get employee details (Admin or self)
  app.get('/api/employees/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_ID'
        });
      }

      // Check permissions - admin can see all, employees can only see themselves
      const isAdmin = req.user!.role === 'admin';
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only view own profile',
            code: 'ACCESS_DENIED'
          });
        }
      }

      const employee = await storage.getEmployeeWithDetails(employeeId);
      if (!employee) {
        return res.status(404).json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        });
      }

      res.json({
        message: 'Employee retrieved successfully',
        data: employee,
      });
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({
        error: 'Failed to fetch employee',
        code: 'FETCH_EMPLOYEE_ERROR'
      });
    }
  });

  // POST /api/employees - Create new employee (Admin only)
  app.post('/api/employees', authenticateToken, authorizeRole(['admin']), validateRequest(createEmployeeSchema), async (req: AuthRequest, res: Response) => {
    try {
      const employeeData = req.body;

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(employeeData.email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Generate employee number if not provided
      const employeeNumber = employeeData.employeeNumber || `EMP${Date.now().toString().slice(-6)}`;

      // Create user account
      const newUser = await storage.createUser({
        username: employeeData.email.split('@')[0], // Use email prefix as username
        email: employeeData.email,
        password: hashedPassword,
        role: 'employee',
      });

      // Create employee record
      const newEmployee = await storage.createEmployee({
        user_id: newUser.id,
        employee_number: employeeNumber,
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        department_id: employeeData.departmentId,
        manager_id: employeeData.managerId,
        hire_date: employeeData.hireDate,
        contract_type: employeeData.contractType,
        hourly_rate: employeeData.hourlyRate,
        vacation_days_total: employeeData.vacationDaysTotal,
        phone: employeeData.phone,
        address: employeeData.address,
      });

      // TODO: Send welcome email with temporary password
      console.log(`Welcome email should be sent to ${employeeData.email} with temp password: ${tempPassword}`);

      res.status(201).json({
        message: 'Employee created successfully',
        data: {
          employee: newEmployee,
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
          },
          temporaryPassword: tempPassword, // In production, this should be sent via email only
        },
      });
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({
        error: 'Failed to create employee',
        code: 'CREATE_EMPLOYEE_ERROR'
      });
    }
  });

  // PUT /api/employees/:id - Update employee (Admin or self with restrictions)
  app.put('/api/employees/:id', authenticateToken, validateRequest(updateEmployeeSchema), async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_ID'
        });
      }

      const updateData = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Check permissions
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only update own profile',
            code: 'ACCESS_DENIED'
          });
        }

        // Employees can only update limited fields
        const allowedFields = ['phone', 'address'];
        const updateFields = Object.keys(updateData);
        const restrictedFields = updateFields.filter(field => !allowedFields.includes(field));
        
        if (restrictedFields.length > 0) {
          return res.status(403).json({
            error: 'Access denied - cannot update restricted fields',
            code: 'RESTRICTED_FIELDS',
            restrictedFields,
            allowedFields,
          });
        }
      }

      // Verify employee exists
      const existingEmployee = await storage.getEmployee(employeeId);
      if (!existingEmployee) {
        return res.status(404).json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        });
      }

      // Convert frontend field names to database field names
      const dbUpdateData: any = {};
      if (updateData.firstName) dbUpdateData.first_name = updateData.firstName;
      if (updateData.lastName) dbUpdateData.last_name = updateData.lastName;
      if (updateData.departmentId) dbUpdateData.department_id = updateData.departmentId;
      if (updateData.managerId) dbUpdateData.manager_id = updateData.managerId;
      if (updateData.employeeNumber) dbUpdateData.employee_number = updateData.employeeNumber;
      if (updateData.contractType) dbUpdateData.contract_type = updateData.contractType;
      if (updateData.hourlyRate) dbUpdateData.hourly_rate = updateData.hourlyRate;
      if (updateData.vacationDaysTotal) dbUpdateData.vacation_days_total = updateData.vacationDaysTotal;
      if (updateData.vacationDaysUsed !== undefined) dbUpdateData.vacation_days_used = updateData.vacationDaysUsed;
      if (updateData.isActive !== undefined) dbUpdateData.is_active = updateData.isActive;
      if (updateData.phone) dbUpdateData.phone = updateData.phone;
      if (updateData.address) dbUpdateData.address = updateData.address;
      if (updateData.hireDate) dbUpdateData.hire_date = updateData.hireDate;

      // Update employee
      const updatedEmployee = await storage.updateEmployee(employeeId, dbUpdateData);
      if (!updatedEmployee) {
        return res.status(500).json({
          error: 'Failed to update employee',
          code: 'UPDATE_FAILED'
        });
      }

      // TODO: Log the changes for audit trail
      console.log(`Employee ${employeeId} updated by user ${req.user!.id}:`, Object.keys(dbUpdateData));

      res.json({
        message: 'Employee updated successfully',
        data: updatedEmployee,
      });
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({
        error: 'Failed to update employee',
        code: 'UPDATE_EMPLOYEE_ERROR'
      });
    }
  });

  // DELETE /api/employees/:id - Soft delete employee (Admin only)
  app.delete('/api/employees/:id', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_ID'
        });
      }

      // Verify employee exists
      const existingEmployee = await storage.getEmployee(employeeId);
      if (!existingEmployee) {
        return res.status(404).json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        });
      }

      // Soft delete (will check for future planning entries)
      const deletedEmployee = await storage.softDeleteEmployee(employeeId);
      
      if (!deletedEmployee) {
        return res.status(500).json({
          error: 'Failed to deactivate employee',
          code: 'DELETE_FAILED'
        });
      }

      res.json({
        message: 'Employee deactivated successfully',
        data: deletedEmployee,
      });
    } catch (error) {
      console.error('Delete employee error:', error);
      if (error instanceof Error && error.message.includes('future planning entries')) {
        return res.status(409).json({
          error: error.message,
          code: 'HAS_FUTURE_PLANNING'
        });
      }
      
      res.status(500).json({
        error: 'Failed to deactivate employee',
        code: 'DELETE_EMPLOYEE_ERROR'
      });
    }
  });

  // GET /api/employees/:id/stats - Get employee statistics (Admin or self)
  app.get('/api/employees/:id/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_ID'
        });
      }

      // Check permissions - admin can see all, employees can only see themselves
      const isAdmin = req.user!.role === 'admin';
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only view own stats',
            code: 'ACCESS_DENIED'
          });
        }
      }

      const stats = await storage.getEmployeeStats(employeeId);
      if (!stats) {
        return res.status(404).json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        });
      }

      res.json({
        message: 'Employee statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Get employee stats error:', error);
      res.status(500).json({
        error: 'Failed to fetch employee statistics',
        code: 'FETCH_STATS_ERROR'
      });
    }
  });

  // ========================================
  // PLANNING API ENDPOINTS
  // ========================================

  // GET /api/planning - Get planning entries with filters
  app.get('/api/planning', authenticateToken, validateRequest(planningQuerySchema), async (req: AuthRequest, res: Response) => {
    try {
      const { start_date, end_date, employee_id, department_id } = req.query as any;
      
      // Check permissions - employees can only see their own planning
      const isAdmin = req.user!.role === 'admin';
      let targetEmployeeId = employee_id;
      
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        
        // Override employee_id to only show current user's planning
        targetEmployeeId = currentUserEmployee.id;
      }

      const planningEntries = await storage.getPlanningEntries(
        start_date, 
        end_date, 
        targetEmployeeId, 
        department_id
      );

      // Group by date and calculate totals
      const entriesByDate = planningEntries.reduce((acc, entry) => {
        if (!acc[entry.date]) {
          acc[entry.date] = { entries: [], totalHours: 0, types: {} };
        }
        acc[entry.date].entries.push(entry);
        
        // Calculate hours for work entries
        if (entry.startTime && entry.endTime && entry.type === 'work') {
          const start = new Date(`1970-01-01T${entry.startTime}:00`);
          const end = new Date(`1970-01-01T${entry.endTime}:00`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          acc[entry.date].totalHours += hours;
        }
        
        // Count types
        acc[entry.date].types[entry.type] = (acc[entry.date].types[entry.type] || 0) + 1;
        
        return acc;
      }, {} as Record<string, any>);

      res.json({
        message: 'Planning entries retrieved successfully',
        data: {
          startDate: start_date,
          endDate: end_date,
          entriesByDate,
          totalEntries: planningEntries.length,
        },
      });
    } catch (error) {
      console.error('Get planning error:', error);
      res.status(500).json({
        error: 'Failed to fetch planning entries',
        code: 'FETCH_PLANNING_ERROR'
      });
    }
  });

  // POST /api/planning/generate - Generate planning for a period (Admin only)
  app.post('/api/planning/generate', authenticateToken, authorizeRole(['admin']), validateRequest(generatePlanningSchema), async (req: AuthRequest, res: Response) => {
    try {
      const { start_date, end_date, template_id, employee_ids, department_id } = req.body;

      const generatedEntries = await storage.generatePlanningForPeriod(
        start_date,
        end_date,
        employee_ids,
        department_id,
        template_id
      );

      res.status(201).json({
        message: 'Planning generated successfully',
        data: {
          generatedEntries: generatedEntries.length,
          entries: generatedEntries,
          period: { start_date, end_date },
        },
      });
    } catch (error) {
      console.error('Generate planning error:', error);
      res.status(500).json({
        error: 'Failed to generate planning',
        code: 'GENERATE_PLANNING_ERROR'
      });
    }
  });

  // GET /api/planning/:employee_id/week/:date - Get weekly planning for employee
  app.get('/api/planning/:employee_id/week/:date', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employee_id);
      const weekStart = req.params.date;

      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_EMPLOYEE_ID'
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        return res.status(400).json({
          error: 'Invalid date format, use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT'
        });
      }

      // Check permissions
      const isAdmin = req.user!.role === 'admin';
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only view own planning',
            code: 'ACCESS_DENIED'
          });
        }
      }

      const weeklyPlanning = await storage.getEmployeeWeeklyPlanning(employeeId, weekStart);

      res.json({
        message: 'Weekly planning retrieved successfully',
        data: weeklyPlanning,
      });
    } catch (error) {
      console.error('Get weekly planning error:', error);
      res.status(500).json({
        error: 'Failed to fetch weekly planning',
        code: 'FETCH_WEEKLY_PLANNING_ERROR'
      });
    }
  });

  // PUT /api/planning/:id - Update planning entry
  app.put('/api/planning/:id', authenticateToken, validateRequest(updatePlanningEntrySchema), async (req: AuthRequest, res: Response) => {
    try {
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({
          error: 'Invalid planning entry ID',
          code: 'INVALID_ID'
        });
      }

      const updateData = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Get existing entry to check ownership
      const existingEntries = await storage.getPlanningEntries(
        '1900-01-01', // Very old date
        '2100-12-31', // Very future date  
        undefined,
        undefined
      );
      const existingEntry = existingEntries.find(e => e.id === entryId);

      if (!existingEntry) {
        return res.status(404).json({
          error: 'Planning entry not found',
          code: 'ENTRY_NOT_FOUND'
        });
      }

      // Check permissions
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== existingEntry.employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only update own planning',
            code: 'ACCESS_DENIED'
          });
        }
      }

      // Validate conflicts if changing time/date
      if (updateData.date || updateData.start_time || updateData.end_time) {
        const targetDate = updateData.date || existingEntry.date;
        const targetStartTime = updateData.start_time || existingEntry.startTime;
        const targetEndTime = updateData.end_time || existingEntry.endTime;

        if (targetStartTime && targetEndTime) {
          const validation = await storage.validateDailyHours(
            existingEntry.employeeId,
            targetDate,
            targetStartTime,
            targetEndTime
          );

          if (!validation.valid) {
            return res.status(409).json({
              error: 'Planning conflicts detected',
              code: 'PLANNING_CONFLICTS',
              conflicts: validation.conflicts,
            });
          }

          // Check rest period
          const restValidation = await storage.validateRestPeriod(
            existingEntry.employeeId,
            targetDate,
            targetStartTime
          );

          if (!restValidation.valid) {
            return res.status(409).json({
              error: 'Rest period violation',
              code: 'REST_PERIOD_VIOLATION',
              conflicts: restValidation.conflicts,
            });
          }
        }
      }

      // Convert frontend field names to database field names
      const dbUpdateData: any = {};
      if (updateData.date) dbUpdateData.date = updateData.date;
      if (updateData.start_time) dbUpdateData.start_time = updateData.start_time;
      if (updateData.end_time) dbUpdateData.end_time = updateData.end_time;
      if (updateData.type) dbUpdateData.type = updateData.type;
      if (updateData.status) dbUpdateData.status = updateData.status;
      if (updateData.notes) dbUpdateData.notes = updateData.notes;

      const updatedEntry = await storage.updatePlanningEntry(entryId, dbUpdateData);
      
      if (!updatedEntry) {
        return res.status(500).json({
          error: 'Failed to update planning entry',
          code: 'UPDATE_FAILED'
        });
      }

      res.json({
        message: 'Planning entry updated successfully',
        data: updatedEntry,
      });
    } catch (error) {
      console.error('Update planning entry error:', error);
      res.status(500).json({
        error: 'Failed to update planning entry',
        code: 'UPDATE_PLANNING_ERROR'
      });
    }
  });

  // POST /api/planning/bulk - Bulk create/update planning entries (Admin only)
  app.post('/api/planning/bulk', authenticateToken, authorizeRole(['admin']), validateRequest(bulkPlanningSchema), async (req: AuthRequest, res: Response) => {
    try {
      const { entries } = req.body;
      
      // Separate creates and updates
      const createEntries = entries.filter((e: any) => !e.id);
      const updateEntries = entries.filter((e: any) => e.id);

      // Validate all entries for conflicts
      const validationResults = [];
      for (const entry of entries) {
        const validation = await storage.validateDailyHours(
          entry.employee_id,
          entry.date,
          entry.start_time,
          entry.end_time
        );
        
        if (!validation.valid) {
          validationResults.push({
            entry,
            conflicts: validation.conflicts,
          });
        }
      }

      if (validationResults.length > 0) {
        return res.status(409).json({
          error: 'Multiple planning conflicts detected',
          code: 'BULK_PLANNING_CONFLICTS',
          conflicts: validationResults,
        });
      }

      // Execute bulk operations
      const results = {
        created: [],
        updated: [],
      };

      if (createEntries.length > 0) {
        const createdEntries = await storage.bulkCreatePlanningEntries(
          createEntries.map((e: any) => ({
            employee_id: e.employee_id,
            date: e.date,
            start_time: e.start_time,
            end_time: e.end_time,
            type: e.type || 'work',
            status: 'draft',
            notes: e.notes,
          }))
        );
        results.created = createdEntries;
      }

      if (updateEntries.length > 0) {
        const updatedEntries = await storage.bulkUpdatePlanningEntries(
          updateEntries.map((e: any) => ({
            id: e.id,
            data: {
              date: e.date,
              start_time: e.start_time,
              end_time: e.end_time,
              type: e.type,
              notes: e.notes,
            },
          }))
        );
        results.updated = updatedEntries;
      }

      res.status(201).json({
        message: 'Bulk planning operation completed successfully',
        data: results,
        summary: {
          totalProcessed: entries.length,
          created: results.created.length,
          updated: results.updated.length,
        },
      });
    } catch (error) {
      console.error('Bulk planning error:', error);
      res.status(500).json({
        error: 'Failed to process bulk planning operation',
        code: 'BULK_PLANNING_ERROR'
      });
    }
  });

  // POST /api/planning/validate - Validate planning for employee/week (Admin/Manager only)
  app.post('/api/planning/validate', authenticateToken, authorizeRole(['admin']), validateRequest(validatePlanningSchema), async (req: AuthRequest, res: Response) => {
    try {
      const { employee_id, week_start, status, comments } = req.body;

      // Check if employee exists
      const employee = await storage.getEmployee(employee_id);
      if (!employee) {
        return res.status(404).json({
          error: 'Employee not found',
          code: 'EMPLOYEE_NOT_FOUND'
        });
      }

      // Check for existing validation
      const existingValidation = await storage.getValidationByEmployeeAndWeek(employee_id, week_start);
      if (existingValidation) {
        return res.status(409).json({
          error: 'Validation already exists for this employee and week',
          code: 'VALIDATION_EXISTS',
          data: existingValidation,
        });
      }

      // Create validation entry
      const validation = await storage.createValidation({
        employee_id,
        week_start,
        status,
        comments,
        validator_id: req.user!.id,
      });

      // Get planning summary for the week
      const weeklyPlanning = await storage.getEmployeeWeeklyPlanning(employee_id, week_start);

      res.status(201).json({
        message: 'Planning validation created successfully',
        data: {
          validation,
          planningSummary: weeklyPlanning.summary,
        },
      });
    } catch (error) {
      console.error('Validate planning error:', error);
      res.status(500).json({
        error: 'Failed to validate planning',
        code: 'VALIDATE_PLANNING_ERROR'
      });
    }
  });

  // GET /api/planning/conflicts - Detect planning conflicts
  app.get('/api/planning/conflicts', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { employee_id, start_date, end_date } = req.query;
      
      // Check permissions
      const isAdmin = req.user!.role === 'admin';
      let targetEmployeeId = employee_id ? parseInt(employee_id as string) : undefined;
      
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        
        // Override to only check current user's conflicts
        targetEmployeeId = currentUserEmployee.id;
      }

      const conflicts = await storage.detectPlanningConflicts(
        targetEmployeeId,
        start_date as string,
        end_date as string
      );

      // Group conflicts by severity
      const groupedConflicts = {
        errors: conflicts.filter(c => c.severity === 'error'),
        warnings: conflicts.filter(c => c.severity === 'warning'),
      };

      res.json({
        message: 'Planning conflicts analysis completed',
        data: {
          conflicts,
          summary: {
            totalConflicts: conflicts.length,
            errors: groupedConflicts.errors.length,
            warnings: groupedConflicts.warnings.length,
            affectedEmployees: [...new Set(conflicts.map(c => c.employeeId))].length,
          },
          groupedConflicts,
        },
      });
    } catch (error) {
      console.error('Detect conflicts error:', error);
      res.status(500).json({
        error: 'Failed to detect planning conflicts',
        code: 'DETECT_CONFLICTS_ERROR'
      });
    }
  });

  // ========================================
  // TIME ENTRIES API ENDPOINTS
  // ========================================

  // GET /api/time-entries - Get time entries with filters and grouping
  app.get('/api/time-entries', authenticateToken, validateRequest(timeEntryQuerySchema), async (req: AuthRequest, res: Response) => {
    try {
      const { employee_id, date_from, date_to, status, group_by, page, limit } = req.query as any;
      
      // Check permissions - employees can only see their own time entries
      const isAdmin = req.user!.role === 'admin';
      let targetEmployeeId = employee_id;
      
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        
        // Override employee_id to only show current user's time entries
        targetEmployeeId = currentUserEmployee.id;
      }

      const result = await storage.getTimeEntries(
        targetEmployeeId,
        date_from,
        date_to,
        status,
        page,
        limit
      );

      // Group entries by specified period
      let groupedEntries = {};
      let totalsByCategory = {};

      if (group_by && result.entries.length > 0) {
        groupedEntries = result.entries.reduce((acc, entry) => {
          let groupKey;
          const entryDate = new Date(entry.date);
          
          switch (group_by) {
            case 'week':
              const weekStart = new Date(entryDate);
              weekStart.setDate(entryDate.getDate() - entryDate.getDay() + 1);
              groupKey = weekStart.toISOString().split('T')[0];
              break;
            case 'month':
              groupKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
              break;
            case 'day':
            default:
              groupKey = entry.date;
              break;
          }
          
          if (!acc[groupKey]) {
            acc[groupKey] = { entries: [], totalHours: 0, overtimeHours: 0 };
          }
          
          acc[groupKey].entries.push(entry);
          acc[groupKey].totalHours += entry.workingHours || 0;
          if (entry.isOvertime) {
            acc[groupKey].overtimeHours += entry.workingHours || 0;
          }
          
          return acc;
        }, {} as Record<string, any>);

        // Calculate totals by category
        totalsByCategory = result.entries.reduce((acc, entry) => {
          const category = entry.projectName || 'No Project';
          if (!acc[category]) {
            acc[category] = { hours: 0, entries: 0 };
          }
          acc[category].hours += entry.workingHours || 0;
          acc[category].entries += 1;
          return acc;
        }, {} as Record<string, any>);
      }

      res.json({
        message: 'Time entries retrieved successfully',
        data: {
          ...result,
          groupedBy: group_by,
          groupedEntries,
          totalsByCategory,
        },
      });
    } catch (error) {
      console.error('Get time entries error:', error);
      res.status(500).json({
        error: 'Failed to fetch time entries',
        code: 'FETCH_TIME_ENTRIES_ERROR'
      });
    }
  });

  // GET /api/time-entries/:employee_id/current - Get current day time entries
  app.get('/api/time-entries/:employee_id/current', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employee_id);
      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_EMPLOYEE_ID'
        });
      }

      // Check permissions
      const isAdmin = req.user!.role === 'admin';
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only view own time entries',
            code: 'ACCESS_DENIED'
          });
        }
      }

      const currentEntries = await storage.getCurrentDayTimeEntries(employeeId);
      
      // Calculate daily totals
      const dailyTotals = currentEntries.reduce((acc, entry) => {
        acc.totalHours += entry.workingHours || 0;
        if (entry.isOvertime) {
          acc.overtimeHours += entry.workingHours || 0;
        }
        return acc;
      }, { totalHours: 0, overtimeHours: 0 });

      res.json({
        message: 'Current day time entries retrieved successfully',
        data: {
          employeeId,
          date: new Date().toISOString().split('T')[0],
          entries: currentEntries,
          dailyTotals: {
            totalHours: Math.round(dailyTotals.totalHours * 100) / 100,
            overtimeHours: Math.round(dailyTotals.overtimeHours * 100) / 100,
            regularHours: Math.round((dailyTotals.totalHours - dailyTotals.overtimeHours) * 100) / 100,
            entryCount: currentEntries.length,
          },
        },
      });
    } catch (error) {
      console.error('Get current time entries error:', error);
      res.status(500).json({
        error: 'Failed to fetch current time entries',
        code: 'FETCH_CURRENT_TIME_ENTRIES_ERROR'
      });
    }
  });

  // POST /api/time-entries - Create new time entry
  app.post('/api/time-entries', authenticateToken, validateRequest(createTimeEntrySchema), async (req: AuthRequest, res: Response) => {
    try {
      const timeEntryData = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Determine target employee ID
      let targetEmployeeId = timeEntryData.employee_id;
      if (!isAdmin) {
        // Non-admin users can only create entries for themselves
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        targetEmployeeId = currentUserEmployee.id;
      } else if (!targetEmployeeId) {
        return res.status(400).json({
          error: 'Employee ID is required for admin users',
          code: 'EMPLOYEE_ID_REQUIRED'
        });
      }

      // Validate overlap
      const overlapValidation = await storage.validateTimeEntryOverlap(
        targetEmployeeId,
        timeEntryData.date,
        timeEntryData.start_time,
        timeEntryData.end_time
      );

      if (!overlapValidation.valid) {
        return res.status(409).json({
          error: 'Time entry conflicts detected',
          code: 'TIME_ENTRY_CONFLICTS',
          conflicts: overlapValidation.conflicts,
        });
      }

      // Calculate working hours
      const workingHours = storage.calculateWorkingHours(
        timeEntryData.start_time,
        timeEntryData.end_time,
        timeEntryData.break_duration || 0
      );

      // Calculate overtime if applicable
      const overtimeCalculation = await storage.calculateOvertimeHours(
        targetEmployeeId,
        timeEntryData.date,
        workingHours
      );

      // Create entry with calculated values
      const entryToCreate = {
        employee_id: targetEmployeeId,
        date: timeEntryData.date,
        start_time: timeEntryData.start_time,
        end_time: timeEntryData.end_time,
        break_duration: timeEntryData.break_duration || 0,
        project_id: timeEntryData.project_id,
        task_id: timeEntryData.task_id,
        description: timeEntryData.description,
        location: timeEntryData.location,
        is_overtime: timeEntryData.is_overtime || overtimeCalculation.overtimeHours > 0,
        overtime_reason: timeEntryData.overtime_reason,
        status: 'draft',
      };

      const createdEntry = await storage.createTimeEntry(entryToCreate);

      // Check for planning association
      const planningEntries = await storage.getPlanningEntries(
        timeEntryData.date,
        timeEntryData.date,
        targetEmployeeId
      );

      res.status(201).json({
        message: 'Time entry created successfully',
        data: {
          timeEntry: createdEntry,
          calculatedHours: {
            workingHours: Math.round(workingHours * 100) / 100,
            regularHours: Math.round(overtimeCalculation.regularHours * 100) / 100,
            overtimeHours: Math.round(overtimeCalculation.overtimeHours * 100) / 100,
          },
          planningAssociation: planningEntries.length > 0,
        },
      });
    } catch (error) {
      console.error('Create time entry error:', error);
      res.status(500).json({
        error: 'Failed to create time entry',
        code: 'CREATE_TIME_ENTRY_ERROR'
      });
    }
  });

  // PUT /api/time-entries/:id - Update time entry
  app.put('/api/time-entries/:id', authenticateToken, validateRequest(updateTimeEntrySchema), async (req: AuthRequest, res: Response) => {
    try {
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({
          error: 'Invalid time entry ID',
          code: 'INVALID_ID'
        });
      }

      const updateData = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Get existing entry to check ownership and status
      const { entries } = await storage.getTimeEntries();
      const existingEntry = entries.find(e => e.id === entryId);

      if (!existingEntry) {
        return res.status(404).json({
          error: 'Time entry not found',
          code: 'ENTRY_NOT_FOUND'
        });
      }

      // Check if entry can be modified (only if not validated)
      if (existingEntry.status === 'validated') {
        return res.status(403).json({
          error: 'Cannot modify validated time entry',
          code: 'ENTRY_VALIDATED'
        });
      }

      // Check permissions
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== existingEntry.employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only update own time entries',
            code: 'ACCESS_DENIED'
          });
        }
      }

      // Validate overlap if changing time
      if (updateData.start_time || updateData.end_time || updateData.date) {
        const targetDate = updateData.date || existingEntry.date;
        const targetStartTime = updateData.start_time || existingEntry.startTime;
        const targetEndTime = updateData.end_time || existingEntry.endTime;

        const overlapValidation = await storage.validateTimeEntryOverlap(
          existingEntry.employeeId,
          targetDate,
          targetStartTime,
          targetEndTime,
          entryId // Exclude current entry from overlap check
        );

        if (!overlapValidation.valid) {
          return res.status(409).json({
            error: 'Time entry conflicts detected',
            code: 'TIME_ENTRY_CONFLICTS',
            conflicts: overlapValidation.conflicts,
          });
        }
      }

      // Recalculate overtime if time changes
      let overtimeCalculation = null;
      if (updateData.start_time || updateData.end_time || updateData.break_duration !== undefined) {
        const newStartTime = updateData.start_time || existingEntry.startTime;
        const newEndTime = updateData.end_time || existingEntry.endTime;
        const newBreakDuration = updateData.break_duration !== undefined ? updateData.break_duration : existingEntry.breakDuration;

        const workingHours = storage.calculateWorkingHours(newStartTime, newEndTime, newBreakDuration);
        overtimeCalculation = await storage.calculateOvertimeHours(
          existingEntry.employeeId,
          updateData.date || existingEntry.date,
          workingHours
        );

        // Auto-update overtime flag if overtime hours calculated
        if (overtimeCalculation.overtimeHours > 0 && !updateData.is_overtime) {
          updateData.is_overtime = true;
        }
      }

      const updatedEntry = await storage.updateTimeEntry(entryId, updateData);
      
      if (!updatedEntry) {
        return res.status(500).json({
          error: 'Failed to update time entry',
          code: 'UPDATE_FAILED'
        });
      }

      res.json({
        message: 'Time entry updated successfully',
        data: {
          timeEntry: updatedEntry,
          recalculatedHours: overtimeCalculation ? {
            regularHours: Math.round(overtimeCalculation.regularHours * 100) / 100,
            overtimeHours: Math.round(overtimeCalculation.overtimeHours * 100) / 100,
          } : null,
        },
      });
    } catch (error) {
      console.error('Update time entry error:', error);
      res.status(500).json({
        error: 'Failed to update time entry',
        code: 'UPDATE_TIME_ENTRY_ERROR'
      });
    }
  });

  // DELETE /api/time-entries/:id - Delete time entry (draft only)
  app.delete('/api/time-entries/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const entryId = parseInt(req.params.id);
      if (isNaN(entryId)) {
        return res.status(400).json({
          error: 'Invalid time entry ID',
          code: 'INVALID_ID'
        });
      }

      const isAdmin = req.user!.role === 'admin';

      // Get existing entry to check ownership and status
      const { entries } = await storage.getTimeEntries();
      const existingEntry = entries.find(e => e.id === entryId);

      if (!existingEntry) {
        return res.status(404).json({
          error: 'Time entry not found',
          code: 'ENTRY_NOT_FOUND'
        });
      }

      // Check if entry can be deleted (only draft status)
      if (existingEntry.status !== 'draft') {
        return res.status(403).json({
          error: 'Can only delete draft time entries',
          code: 'INVALID_STATUS_FOR_DELETION'
        });
      }

      // Check permissions
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== existingEntry.employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only delete own time entries',
            code: 'ACCESS_DENIED'
          });
        }
      }

      const deleted = await storage.deleteTimeEntry(entryId);
      
      if (!deleted) {
        return res.status(500).json({
          error: 'Failed to delete time entry',
          code: 'DELETE_FAILED'
        });
      }

      res.json({
        message: 'Time entry deleted successfully',
        data: { deletedEntryId: entryId },
      });
    } catch (error) {
      console.error('Delete time entry error:', error);
      res.status(500).json({
        error: 'Failed to delete time entry',
        code: 'DELETE_TIME_ENTRY_ERROR'
      });
    }
  });

  // POST /api/time-entries/bulk - Bulk save weekly time entries
  app.post('/api/time-entries/bulk', authenticateToken, validateRequest(bulkTimeEntriesSchema), async (req: AuthRequest, res: Response) => {
    try {
      const { entries, week_start } = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Determine target employee ID and validate permissions
      let targetEmployeeId;
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        targetEmployeeId = currentUserEmployee.id;
        
        // Ensure all entries are for the current user
        const invalidEntries = entries.filter((e: any) => e.employee_id && e.employee_id !== targetEmployeeId);
        if (invalidEntries.length > 0) {
          return res.status(403).json({
            error: 'Cannot create time entries for other employees',
            code: 'INVALID_EMPLOYEE_ENTRIES'
          });
        }
      }

      // Separate creates and updates
      const createEntries = entries.filter((e: any) => !e.id);
      const updateEntries = entries.filter((e: any) => e.id);

      // Validate all entries for overlaps and consistency
      const validationResults = [];
      for (const entry of entries) {
        const empId = entry.employee_id || targetEmployeeId;
        
        const overlapValidation = await storage.validateTimeEntryOverlap(
          empId,
          entry.date,
          entry.start_time,
          entry.end_time,
          entry.id // Exclude self for updates
        );
        
        if (!overlapValidation.valid) {
          validationResults.push({
            entry,
            conflicts: overlapValidation.conflicts,
          });
        }
      }

      if (validationResults.length > 0) {
        return res.status(409).json({
          error: 'Multiple time entry conflicts detected',
          code: 'BULK_TIME_ENTRY_CONFLICTS',
          conflicts: validationResults,
        });
      }

      // Execute bulk operations in transaction-like manner
      const results = {
        created: [],
        updated: [],
        calculatedHours: [],
      };

      if (createEntries.length > 0) {
        const entriesToCreate = createEntries.map((e: any) => ({
          employee_id: e.employee_id || targetEmployeeId,
          date: e.date,
          start_time: e.start_time,
          end_time: e.end_time,
          break_duration: e.break_duration || 0,
          project_id: e.project_id,
          task_id: e.task_id,
          description: e.description,
          location: e.location,
          is_overtime: e.is_overtime || false,
          overtime_reason: e.overtime_reason,
          status: 'draft',
        }));

        const createdEntries = await storage.bulkCreateTimeEntries(entriesToCreate);
        results.created = createdEntries;

        // Calculate hours for created entries
        for (const entry of createdEntries) {
          const workingHours = storage.calculateWorkingHours(
            entry.start_time,
            entry.end_time,
            entry.break_duration
          );
          const overtimeCalc = await storage.calculateOvertimeHours(
            entry.employee_id,
            entry.date,
            workingHours
          );
          results.calculatedHours.push({
            entryId: entry.id,
            workingHours: Math.round(workingHours * 100) / 100,
            ...overtimeCalc,
          });
        }
      }

      if (updateEntries.length > 0) {
        const updatedEntries = await storage.bulkUpdateTimeEntries(
          updateEntries.map((e: any) => ({
            id: e.id,
            data: {
              date: e.date,
              start_time: e.start_time,
              end_time: e.end_time,
              break_duration: e.break_duration,
              project_id: e.project_id,
              task_id: e.task_id,
              description: e.description,
              location: e.location,
              is_overtime: e.is_overtime,
              overtime_reason: e.overtime_reason,
            },
          }))
        );
        results.updated = updatedEntries;
      }

      // Compare with planning for the week
      const weekStartDate = new Date(week_start);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      const weekEnd = weekEndDate.toISOString().split('T')[0];

      const planningComparison = await storage.compareTimeWithPlanning(
        targetEmployeeId || entries[0]?.employee_id,
        week_start,
        weekEnd
      );

      res.status(201).json({
        message: 'Bulk time entries operation completed successfully',
        data: {
          ...results,
          weekStart: week_start,
          planningComparison: planningComparison.summary,
          summary: {
            totalProcessed: entries.length,
            created: results.created.length,
            updated: results.updated.length,
          },
        },
      });
    } catch (error) {
      console.error('Bulk time entries error:', error);
      res.status(500).json({
        error: 'Failed to process bulk time entries operation',
        code: 'BULK_TIME_ENTRIES_ERROR'
      });
    }
  });

  // POST /api/time-entries/submit - Submit weekly time entries for validation
  app.post('/api/time-entries/submit', authenticateToken, validateRequest(submitTimeEntriesSchema), async (req: AuthRequest, res: Response) => {
    try {
      const { week_start_date, employee_id } = req.body;
      const isAdmin = req.user!.role === 'admin';

      // Determine target employee ID
      let targetEmployeeId = employee_id;
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee) {
          return res.status(403).json({
            error: 'Employee profile not found',
            code: 'EMPLOYEE_NOT_FOUND'
          });
        }
        targetEmployeeId = currentUserEmployee.id;
      } else if (!targetEmployeeId) {
        return res.status(400).json({
          error: 'Employee ID is required for admin users',
          code: 'EMPLOYEE_ID_REQUIRED'
        });
      }

      // Verify completeness and submit
      const submissionResult = await storage.submitWeeklyTimeEntries(targetEmployeeId, week_start_date);

      if (submissionResult.errors.length > 0 && submissionResult.submitted === 0) {
        return res.status(400).json({
          error: 'Failed to submit time entries',
          code: 'SUBMISSION_FAILED',
          details: submissionResult.errors,
        });
      }

      // Get weekly summary after submission
      const weekSummary = await storage.getTimeEntriesSummary(targetEmployeeId, 'current_week');
      
      // Detect any anomalies in the submitted week
      const anomalies = await storage.detectTimeAnomalies(targetEmployeeId, week_start_date);

      res.json({
        message: submissionResult.submitted > 0 ? 'Time entries submitted successfully' : 'No entries to submit',
        data: {
          submitted: submissionResult.submitted,
          errors: submissionResult.errors,
          weekSummary,
          anomalies: anomalies.length > 0 ? anomalies : null,
        },
        warnings: submissionResult.errors.length > 0 ? submissionResult.errors : null,
      });
    } catch (error) {
      console.error('Submit time entries error:', error);
      res.status(500).json({
        error: 'Failed to submit time entries',
        code: 'SUBMIT_TIME_ENTRIES_ERROR'
      });
    }
  });

  // GET /api/time-entries/compare/:employee_id - Compare planning vs actual time
  app.get('/api/time-entries/compare/:employee_id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employeeId = parseInt(req.params.employee_id);
      const { date_from, date_to } = req.query;

      if (isNaN(employeeId)) {
        return res.status(400).json({
          error: 'Invalid employee ID',
          code: 'INVALID_EMPLOYEE_ID'
        });
      }

      // Check permissions
      const isAdmin = req.user!.role === 'admin';
      if (!isAdmin) {
        const currentUserEmployee = await storage.getEmployeeByUserId(req.user!.id);
        if (!currentUserEmployee || currentUserEmployee.id !== employeeId) {
          return res.status(403).json({
            error: 'Access denied - can only view own time comparison',
            code: 'ACCESS_DENIED'
          });
        }
      }

      // Default to current week if no dates provided
      const defaultDateFrom = date_from as string || (() => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        return weekStart.toISOString().split('T')[0];
      })();

      const defaultDateTo = date_to as string || (() => {
        const weekStart = new Date(defaultDateFrom);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd.toISOString().split('T')[0];
      })();

      const comparison = await storage.compareTimeWithPlanning(employeeId, defaultDateFrom, defaultDateTo);
      
      // Detect anomalies for the period
      const anomalies = await storage.detectTimeAnomalies(employeeId, defaultDateFrom, defaultDateTo);
      
      // Generate suggestions based on analysis
      const suggestions = [];
      if (comparison.summary.totalVariance > 5) {
        suggestions.push('Large time variance detected - review planning accuracy');
      }
      if (comparison.summary.totalOvertimeHours > 0) {
        suggestions.push('Overtime recorded - ensure proper authorization');
      }
      if (anomalies.some(a => a.type === 'no_planning')) {
        suggestions.push('Time entries without planning - verify work authorization');
      }
      if (comparison.summary.complianceRate < 80) {
        suggestions.push('Low planning compliance - improve time tracking accuracy');
      }

      res.json({
        message: 'Time comparison analysis completed',
        data: {
          ...comparison,
          anomalies,
          suggestions,
          analysis: {
            complianceGrade: comparison.summary.complianceRate >= 90 ? 'Excellent' : 
                            comparison.summary.complianceRate >= 80 ? 'Good' : 
                            comparison.summary.complianceRate >= 70 ? 'Fair' : 'Poor',
            overtimeRate: comparison.summary.totalActualHours > 0 ? 
                         Math.round((comparison.summary.totalOvertimeHours / comparison.summary.totalActualHours) * 100) : 0,
            planningAccuracy: comparison.summary.totalPlannedHours > 0 ? 
                             Math.round((1 - Math.abs(comparison.summary.totalVariance) / comparison.summary.totalPlannedHours) * 100) : 0,
          },
        },
      });
    } catch (error) {
      console.error('Compare time entries error:', error);
      res.status(500).json({
        error: 'Failed to compare time entries',
        code: 'COMPARE_TIME_ENTRIES_ERROR'
      });
    }
  });

  // GET /api/departments - Both admin and employee
  app.get('/api/departments', authenticateToken, authorizeRole(['admin', 'employee']), async (req: AuthRequest, res: Response) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json({ departments });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        error: 'Failed to fetch departments',
        code: 'FETCH_DEPARTMENTS_ERROR'
      });
    }
  });

  // GET /api/profile - Get current user's employee profile
  app.get('/api/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const employee = await storage.getEmployeeByUserId(req.user!.id);
      if (!employee) {
        return res.status(404).json({
          error: 'Employee profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }
      res.json({ employee });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        code: 'FETCH_PROFILE_ERROR'
      });
    }
  });

  // ========================================
  // FILE UPLOAD ROUTES
  // ========================================
  const uploadService = new UploadService();

  // Serve uploaded files (fallback for local storage)
  app.get('/uploads/:type/:filename', async (req: Request, res: Response) => {
    try {
      const { type, filename } = req.params;
      
      // Validate type
      if (!['avatars', 'logos'].includes(type)) {
        return res.status(404).json({ error: 'Type de fichier non trouvé' });
      }

      // Try object storage first
      try {
        const objectPath = `/objects/${type}/${filename}`;
        const objectStorage = new ObjectStorageService();
        const file = await objectStorage.getObjectEntityFile(objectPath);
        await objectStorage.downloadObject(file, res);
        return;
      } catch (error) {
        // Fallback to local storage (development)
        const filePath = path.join(process.cwd(), 'uploads', type, filename);
        try {
          await fs.access(filePath);
          res.sendFile(filePath);
          return;
        } catch {
          return res.status(404).json({ error: 'Fichier non trouvé' });
        }
      }
    } catch (error) {
      console.error('File serve error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du fichier' });
    }
  });

  // Upload avatar
  app.post('/api/upload/avatar', 
    authenticateToken as any,
    avatarUpload.single('avatar'),
    handleMulterError,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: 'Aucun fichier fourni',
            code: 'NO_FILE'
          });
        }

        if (!req.user) {
          return res.status(401).json({ error: 'Non authentifié' });
        }

        // Get current user's employee profile
        const employee = await storage.getEmployeeByUserId(req.user.id);
        if (!employee) {
          return res.status(404).json({ error: 'Profil employé non trouvé' });
        }

        // Delete old avatar if exists
        if (employee.avatarUrl) {
          try {
            await uploadService.deleteFile(employee.avatarUrl);
          } catch (error) {
            console.warn('Failed to delete old avatar:', error);
          }
        }

        // Upload new avatar
        const avatarUrl = await uploadService.uploadAvatar(req.file, req.user.id);

        // Update employee profile
        await storage.updateEmployee(employee.id, { avatarUrl });

        res.json({
          success: true,
          avatarUrl,
          message: 'Avatar mis à jour avec succès'
        });

      } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
          error: 'Erreur lors de l\'upload de l\'avatar',
          code: 'AVATAR_UPLOAD_ERROR'
        });
      }
    }
  );

  // Upload logo (admin only)
  app.post('/api/upload/logo',
    authenticateToken as any,
    authorizeRole(['admin']) as any,
    logoUpload.single('logo'),
    handleMulterError,
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            error: 'Aucun fichier fourni',
            code: 'NO_FILE'
          });
        }

        // Upload logo
        const logoUrl = await uploadService.uploadLogo(req.file, 'company');

        // TODO: Update company settings with logo URL
        // This would require a company/settings table

        res.json({
          success: true,
          logoUrl,
          message: 'Logo mis à jour avec succès'
        });

      } catch (error) {
        console.error('Logo upload error:', error);
        res.status(500).json({
          error: 'Erreur lors de l\'upload du logo',
          code: 'LOGO_UPLOAD_ERROR'
        });
      }
    }
  );

  // Delete file
  app.delete('/api/upload/:type/:filename',
    authenticateToken as any,
    async (req: AuthRequest, res: Response) => {
      try {
        const { type, filename } = req.params;
        
        // Validate type
        if (!['avatars', 'logos'].includes(type)) {
          return res.status(400).json({ error: 'Type de fichier invalide' });
        }

        // Check permissions
        if (type === 'logos') {
          // Only admin can delete logos
          if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Permission insuffisante' });
          }
        } else if (type === 'avatars') {
          // Users can only delete their own avatars
          const employee = await storage.getEmployeeByUserId(req.user!.id);
          if (!employee || !employee.avatarUrl || !employee.avatarUrl.includes(filename)) {
            return res.status(403).json({ error: 'Permission insuffisante' });
          }
        }

        const objectPath = `/objects/${type}/${filename}`;
        await uploadService.deleteFile(objectPath);

        // Update database
        if (type === 'avatars') {
          const employee = await storage.getEmployeeByUserId(req.user!.id);
          if (employee) {
            await storage.updateEmployee(employee.id, { avatarUrl: null });
          }
        }

        res.json({
          success: true,
          message: 'Fichier supprimé avec succès'
        });

      } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({
          error: 'Erreur lors de la suppression',
          code: 'DELETE_ERROR'
        });
      }
    }
  );

  // Get upload URL for direct upload (alternative method)
  app.post('/api/upload/presigned',
    authenticateToken as any,
    async (req: AuthRequest, res: Response) => {
      try {
        const { type } = req.body;
        
        if (!['avatar', 'logo'].includes(type)) {
          return res.status(400).json({ error: 'Type invalide' });
        }

        if (type === 'logo' && req.user?.role !== 'admin') {
          return res.status(403).json({ error: 'Permission insuffisante' });
        }

        const result = await uploadService.getUploadURL(type);
        
        res.json({
          success: true,
          ...result
        });

      } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({
          error: 'Erreur lors de la génération de l\'URL',
          code: 'PRESIGNED_URL_ERROR'
        });
      }
    }
  );

  // ========================================
  // HEALTH CHECK
  // ========================================
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'ClockPilot API',
      version: '1.0.0'
    });
  });

  // ========================================
  // NOTIFICATIONS API ENDPOINTS
  // ========================================

  // GET /api/notifications - Get user's notifications with pagination and filters
  app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const validation = notificationQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.issues
        });
      }

      const { page, limit, type, read } = validation.data;
      const result = await storage.getNotificationsByUser(req.user!.id, {
        page,
        limit,
        type,
        read
      });

      res.json({
        success: true,
        data: result,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        error: 'Failed to fetch notifications',
        code: 'FETCH_NOTIFICATIONS_ERROR'
      });
    }
  });

  // GET /api/notifications/unread-count - Get unread notifications count
  app.get('/api/notifications/unread-count', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ success: true, count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        error: 'Failed to fetch unread count',
        code: 'FETCH_UNREAD_COUNT_ERROR'
      });
    }
  });

  // POST /api/notifications - Create notification (admin only)
  app.post('/api/notifications', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      const validation = createNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid notification data',
          details: validation.error.issues
        });
      }

      const notificationService = getNotificationService();
      const notification = await notificationService.sendNotificationToUser(
        validation.data.user_id,
        validation.data
      );

      res.status(201).json({
        success: true,
        notification,
        message: 'Notification created and sent successfully'
      });
    } catch (error) {
      console.error('Create notification error:', error);
      res.status(500).json({
        error: 'Failed to create notification',
        code: 'CREATE_NOTIFICATION_ERROR'
      });
    }
  });

  // PUT /api/notifications/:id/read - Mark notification as read
  app.put('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({
          error: 'Invalid notification ID',
          code: 'INVALID_NOTIFICATION_ID'
        });
      }

      // Verify notification belongs to the user
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      if (notification.user_id !== req.user!.id) {
        return res.status(403).json({
          error: 'Access denied - not your notification',
          code: 'ACCESS_DENIED'
        });
      }

      const success = await storage.markNotificationAsRead(notificationId);
      if (success) {
        // Send updated unread count via WebSocket
        const notificationService = getNotificationService();
        await notificationService.sendUnreadCount(req.user!.id);

        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(500).json({
          error: 'Failed to mark notification as read',
          code: 'MARK_READ_ERROR'
        });
      }
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        code: 'MARK_READ_ERROR'
      });
    }
  });

  // POST /api/notifications/read-all - Mark all notifications as read
  app.post('/api/notifications/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const count = await storage.markAllNotificationsAsRead(req.user!.id);
      
      // Send updated unread count via WebSocket
      const notificationService = getNotificationService();
      await notificationService.sendUnreadCount(req.user!.id);

      res.json({
        success: true,
        count,
        message: `${count} notifications marked as read`
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        code: 'MARK_ALL_READ_ERROR'
      });
    }
  });

  // DELETE /api/notifications/:id - Delete notification
  app.delete('/api/notifications/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      if (isNaN(notificationId)) {
        return res.status(400).json({
          error: 'Invalid notification ID',
          code: 'INVALID_NOTIFICATION_ID'
        });
      }

      // Verify notification belongs to the user
      const notification = await storage.getNotification(notificationId);
      if (!notification) {
        return res.status(404).json({
          error: 'Notification not found',
          code: 'NOTIFICATION_NOT_FOUND'
        });
      }

      if (notification.user_id !== req.user!.id) {
        return res.status(403).json({
          error: 'Access denied - not your notification',
          code: 'ACCESS_DENIED'
        });
      }

      const success = await storage.deleteNotification(notificationId);
      if (success) {
        res.json({
          success: true,
          message: 'Notification deleted successfully'
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete notification',
          code: 'DELETE_NOTIFICATION_ERROR'
        });
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        error: 'Failed to delete notification',
        code: 'DELETE_NOTIFICATION_ERROR'
      });
    }
  });

  // ========================================
  // EXPORT ROUTES
  // ========================================
  const exportService = new ExportService();

  // Export planning data
  app.get('/api/planning/export', authenticateToken, authorizeRole(['admin', 'employee']), async (req: AuthRequest, res: Response) => {
    try {
      const { format, date_from, date_to, employee_ids } = req.query;
      
      if (!format || !['excel', 'pdf'].includes(format as string)) {
        return res.status(400).json({
          error: 'Format must be excel or pdf',
          code: 'INVALID_FORMAT'
        });
      }

      // Build query parameters
      const queryParams: any = {};
      if (date_from) queryParams.date_from = date_from;
      if (date_to) queryParams.date_to = date_to;
      if (employee_ids) queryParams.employee_ids = employee_ids;
      
      // For employees, only allow their own data
      if (req.user!.role === 'employee') {
        const employee = await storage.getEmployeeByUserId(req.user!.id);
        if (employee) {
          queryParams.employee_ids = employee.id;
        }
      }

      // Get planning data
      const planningData = await storage.getPlanningEntries(queryParams);
      
      const exportOptions = {
        format: format as 'excel' | 'pdf',
        dateRange: date_from && date_to ? {
          start: date_from as string,
          end: date_to as string
        } : undefined,
        employeeIds: employee_ids ? (Array.isArray(employee_ids) ? employee_ids as string[] : [employee_ids as string]) : undefined
      };

      const buffer = await exportService.exportPlanning(planningData, exportOptions);
      
      const filename = `planning-${format === 'excel' ? 'xlsx' : 'pdf'}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Export planning error:', error);
      res.status(500).json({
        error: 'Failed to export planning',
        code: 'EXPORT_PLANNING_ERROR'
      });
    }
  });

  // Export time entries data
  app.get('/api/time-entries/export', authenticateToken, authorizeRole(['admin', 'employee']), async (req: AuthRequest, res: Response) => {
    try {
      const { format, date_from, date_to, employee_ids } = req.query;
      
      if (!format || !['excel', 'pdf'].includes(format as string)) {
        return res.status(400).json({
          error: 'Format must be excel or pdf',
          code: 'INVALID_FORMAT'
        });
      }

      // Build query parameters
      const queryParams: any = {};
      if (date_from) queryParams.date_from = date_from;
      if (date_to) queryParams.date_to = date_to;
      if (employee_ids) queryParams.employee_ids = employee_ids;
      
      // For employees, only allow their own data
      if (req.user!.role === 'employee') {
        const employee = await storage.getEmployeeByUserId(req.user!.id);
        if (employee) {
          queryParams.employee_ids = employee.id;
        }
      }

      // Get time entries data
      const timeEntriesData = await storage.getTimeEntries(queryParams);
      
      const exportOptions = {
        format: format as 'excel' | 'pdf',
        dateRange: date_from && date_to ? {
          start: date_from as string,
          end: date_to as string
        } : undefined,
        employeeIds: employee_ids ? (Array.isArray(employee_ids) ? employee_ids as string[] : [employee_ids as string]) : undefined
      };

      const buffer = await exportService.exportTimeEntries(timeEntriesData, exportOptions);
      
      const filename = `time-entries-${format === 'excel' ? 'xlsx' : 'pdf'}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Export time entries error:', error);
      res.status(500).json({
        error: 'Failed to export time entries',
        code: 'EXPORT_TIME_ENTRIES_ERROR'
      });
    }
  });

  // Export reports data
  app.get('/api/reports/export', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      const { format, type = 'monthly', date_from, date_to } = req.query;
      
      if (!format || !['excel', 'pdf'].includes(format as string)) {
        return res.status(400).json({
          error: 'Format must be excel or pdf',
          code: 'INVALID_FORMAT'
        });
      }

      // Get employees with their statistics
      const employees = await storage.getAllEmployees();
      
      // Calculate monthly statistics for each employee
      const reportsData = await Promise.all(employees.map(async (employee) => {
        const stats = await storage.getEmployeeStats(employee.id);
        
        // Calculate additional payroll data
        const regularHours = Math.min(stats.weeklyHours || 0, 35); // 35h legal weekly limit
        const overtime25 = Math.max(0, Math.min((stats.weeklyHours || 0) - 35, 8)); // Next 8h at 25%
        const overtime50 = Math.max(0, (stats.weeklyHours || 0) - 43); // Above 43h at 50%
        
        return {
          ...employee,
          plannedHours: stats.weeklyHours || 0,
          workedHours: stats.totalHours || 0,
          overtimeHours: stats.overtimeHours || 0,
          workingDays: Math.ceil((stats.totalHours || 0) / 7), // Approximation
          regularHours,
          overtime25,
          overtime50,
          vacationDays: stats.vacationDays || 0,
          sickDays: stats.sickDays || 0,
        };
      }));
      
      const exportOptions = {
        format: format as 'excel' | 'pdf',
        dateRange: date_from && date_to ? {
          start: date_from as string,
          end: date_to as string
        } : undefined
      };

      const buffer = await exportService.exportReports(reportsData, exportOptions);
      
      const filename = `reports-${type}-${format === 'excel' ? 'xlsx' : 'pdf'}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      res.setHeader('Content-Type', format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Export reports error:', error);
      res.status(500).json({
        error: 'Failed to export reports',
        code: 'EXPORT_REPORTS_ERROR'
      });
    }
  });

  // ========================================
  // ERROR HANDLING MIDDLEWARE
  // ========================================
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  // Create HTTP server and initialize WebSocket service
  const httpServer = createServer(app);
  
  // Initialize notification service with WebSocket support
  initializeNotificationService(httpServer);
  console.log('✅ Notification service with WebSocket initialized');
  
  return httpServer;
}
