import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
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
  const { isAuthenticated, user } = useAuth();
  
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
  const { isAuthenticated, user } = useAuth();

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
);

export default App;
