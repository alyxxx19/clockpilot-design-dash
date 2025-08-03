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
  // PROTECTED ROUTES EXAMPLES
  // ========================================

  // GET /api/employees - Admin only
  app.get('/api/employees', authenticateToken, authorizeRole(['admin']), async (req: AuthRequest, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json({ employees });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({
        error: 'Failed to fetch employees',
        code: 'FETCH_EMPLOYEES_ERROR'
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
