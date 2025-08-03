import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEmployeeSchema, 
  insertProjectSchema, 
  insertTaskSchema, 
  insertTimeEntrySchema, 
  insertScheduleSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== role || user.password !== password) {
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      // Get employee details if user is an employee
      let employee = null;
      if (user.role === 'employee') {
        employee = await storage.getEmployeeByUserId(user.id);
      }

      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        },
        employee 
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Employee routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id);
      
      if (!employee) {
        return res.status(404).json({ error: "Employé non trouvé" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/employees/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employé non trouvé" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Projet non trouvé" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  // Task routes
  app.get("/api/tasks/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const tasks = await storage.getTasksByEmployeeId(employeeId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/tasks/project/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const tasks = await storage.getTasksByProjectId(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ error: "Tâche non trouvée" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTask = await storage.updateTask(id, req.body);
      
      if (!updatedTask) {
        return res.status(404).json({ error: "Tâche non trouvée" });
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Time entry routes
  app.get("/api/time-entries/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const { startDate, endDate } = req.query;
      
      let timeEntries;
      if (startDate && endDate) {
        timeEntries = await storage.getTimeEntriesByDateRange(
          employeeId, 
          startDate as string, 
          endDate as string
        );
      } else {
        timeEntries = await storage.getTimeEntriesByEmployeeId(employeeId);
      }
      
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const timeEntry = await storage.getTimeEntry(id);
      
      if (!timeEntry) {
        return res.status(404).json({ error: "Saisie de temps non trouvée" });
      }

      res.json(timeEntry);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(validatedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedTimeEntry = await storage.updateTimeEntry(id, req.body);
      
      if (!updatedTimeEntry) {
        return res.status(404).json({ error: "Saisie de temps non trouvée" });
      }

      res.json(updatedTimeEntry);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTimeEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Saisie de temps non trouvée" });
      }

      res.json({ message: "Saisie de temps supprimée" });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Schedule routes
  app.get("/api/schedules/employee/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const { startDate, endDate } = req.query;
      
      let schedules;
      if (startDate && endDate) {
        schedules = await storage.getSchedulesByDateRange(
          employeeId, 
          startDate as string, 
          endDate as string
        );
      } else {
        schedules = await storage.getSchedulesByEmployeeId(employeeId);
      }
      
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ error: "Planning non trouvé" });
      }

      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const validatedData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ error: "Données invalides" });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedSchedule = await storage.updateSchedule(id, req.body);
      
      if (!updatedSchedule) {
        return res.status(404).json({ error: "Planning non trouvé" });
      }

      res.json(updatedSchedule);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Dashboard stats route
  app.get("/api/dashboard/stats/:employeeId", async (req, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const currentDate = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // Get current week's time entries
      const weekTimeEntries = await storage.getTimeEntriesByDateRange(
        employeeId, 
        weekStartStr, 
        currentDate
      );
      
      // Get today's time entries
      const todayTimeEntries = await storage.getTimeEntriesByDateRange(
        employeeId, 
        currentDate, 
        currentDate
      );
      
      // Get tasks
      const tasks = await storage.getTasksByEmployeeId(employeeId);
      
      // Get today's schedule
      const todaySchedules = await storage.getSchedulesByDateRange(
        employeeId, 
        currentDate, 
        currentDate
      );
      
      // Calculate stats
      const totalWeekHours = weekTimeEntries.reduce((sum, entry) => 
        sum + parseFloat(entry.hours || '0'), 0
      );
      
      const totalTodayHours = todayTimeEntries.reduce((sum, entry) => 
        sum + parseFloat(entry.hours || '0'), 0
      );
      
      const activeTasks = tasks.filter(task => 
        task.status === 'todo' || task.status === 'in_progress'
      ).length;
      
      const completedTasks = tasks.filter(task => 
        task.status === 'completed'
      ).length;
      
      const todaySchedule = todaySchedules[0] || null;
      
      res.json({
        totalWeekHours: totalWeekHours.toFixed(2),
        totalTodayHours: totalTodayHours.toFixed(2),
        activeTasks,
        completedTasks,
        todaySchedule,
        recentTimeEntries: todayTimeEntries.slice(0, 5),
        upcomingTasks: tasks
          .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
          .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
          })
          .slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Demo data initialization endpoint  
  app.post("/api/init-demo-data", async (req, res) => {
    try {
      await storage.initializeDemoData();
      res.json({ message: "Données de démonstration initialisées" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'initialisation" });
    }
  });

  // Debug endpoint to check users
  app.get("/api/debug/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
