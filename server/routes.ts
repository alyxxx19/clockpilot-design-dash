import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { 
  registerSchema, 
  loginSchema, 
  refreshTokenSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  type User,
  type Employee 
} from "@shared/schema";

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

      const { page = 1, limit = 10, search, department, status, sortBy, sortOrder } = queryValidation.data;

      const result = await storage.getEmployeesWithPagination(page, limit, {
        search,
        department,
        status,
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

  const httpServer = createServer(app);
  return httpServer;
}
