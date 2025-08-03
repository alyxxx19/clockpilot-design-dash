import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Clock, 
  Home, 
  Users, 
  Calendar, 
  CheckCircle, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !"
    });
    navigate('/');
  };

  const adminMenuItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      path: '/admin/dashboard',
      key: 'dashboard'
    },
    { 
      icon: Users, 
      label: 'Employés', 
      path: '/admin/employees',
      key: 'employees'
    },
    { 
      icon: Calendar, 
      label: 'Planning', 
      path: '/admin/planning',
      key: 'planning'
    },
    { 
      icon: CheckCircle, 
      label: 'Validation', 
      path: '/admin/validation',
      key: 'validation'
    },
    { 
      icon: BarChart3, 
      label: 'Rapports', 
      path: '/admin/reports',
      key: 'reports'
    },
    { 
      icon: Settings, 
      label: 'Paramètres', 
      path: '/admin/settings',
      key: 'settings'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed top-0 left-0 z-50 w-64 h-full bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Clock Pilot</span>
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-accent-foreground">
                {user?.employee?.firstName?.charAt(0) || user?.username?.charAt(0) || user?.email?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.username || 'Administrateur'}
              </p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {adminMenuItems.map((item) => (
              <li key={item.key}>
                <Button
                  variant={isActiveRoute(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};