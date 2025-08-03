import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { Employees } from "./pages/admin/Employees";
import { Planning as AdminPlanning } from "./pages/admin/Planning";
import { Validation } from "./pages/admin/Validation";
import { Reports as AdminReports } from "./pages/admin/Reports";
import { Settings as AdminSettings } from "./pages/admin/Settings";
import { EmployeeDashboard } from "./pages/employee/EmployeeDashboard";
import { Planning } from "./pages/employee/Planning";
import { TimeEntry } from "./pages/employee/TimeEntry";
import { Tasks } from "./pages/employee/Tasks";
import { Reports } from "./pages/employee/Reports";
import { Settings } from "./pages/employee/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'admin' | 'employee' }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // For this demo, we'll treat all users as employees
  // In a real app, you'd check user.role
  if (allowedRole === 'admin') {
    return <Navigate to="/employee/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? 
        <Navigate to="/employee/dashboard" replace /> : 
        <Landing />
      } />
      <Route path="/login" element={isAuthenticated ? 
        <Navigate to="/employee/dashboard" replace /> : 
        <Login />
      } />
      
      {/* Admin Routes - Redirected to employee for demo */}
      <Route path="/admin/*" element={<Navigate to="/employee/dashboard" replace />} />
      
      {/* Employee Routes */}
      <Route path="/employee/dashboard" element={
        <ProtectedRoute allowedRole="employee">
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/employee/planning" element={
        <ProtectedRoute allowedRole="employee">
          <Planning />
        </ProtectedRoute>
      } />
      <Route path="/employee/time-entry" element={
        <ProtectedRoute allowedRole="employee">
          <TimeEntry />
        </ProtectedRoute>
      } />
      <Route path="/employee/tasks" element={
        <ProtectedRoute allowedRole="employee">
          <Tasks />
        </ProtectedRoute>
      } />
      <Route path="/employee/reports" element={
        <ProtectedRoute allowedRole="employee">
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/employee/settings" element={
        <ProtectedRoute allowedRole="employee">
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;