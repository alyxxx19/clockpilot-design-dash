import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";

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
import { ScheduleComparison } from "./pages/employee/ScheduleComparison";
import NotFound from "./pages/NotFound";
import { FileUploadDemo } from "@/components/upload/FileUploadDemo";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'admin' | 'employee' }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
  }
  
  return <>{children}</>;
};

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? 
        <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace /> : 
        <Landing />
      } />
      <Route path="/login" element={isAuthenticated ? 
        <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace /> : 
        <Login />
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/employees" element={
        <ProtectedRoute allowedRole="admin">
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/admin/planning" element={
        <ProtectedRoute allowedRole="admin">
          <AdminPlanning />
        </ProtectedRoute>
      } />
      <Route path="/admin/validation" element={
        <ProtectedRoute allowedRole="admin">
          <Validation />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRole="admin">
          <AdminReports />
        </ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRole="admin">
          <AdminSettings />
        </ProtectedRoute>
      } />
      
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
      
      {/* Upload Demo Route */}
      <Route path="/upload-demo" element={
        <ProtectedRoute>
          <FileUploadDemo />
        </ProtectedRoute>
      } />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
