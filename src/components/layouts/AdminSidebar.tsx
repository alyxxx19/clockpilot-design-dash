import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Gestion Employés', href: '/admin/employees', icon: Users },
  { name: 'Planning', href: '/admin/planning', icon: Calendar },
  { name: 'Validation Heures', href: '/admin/validation', icon: CheckSquare, badge: 12 },
  { name: 'Rapports', href: '/admin/reports', icon: BarChart3 },
];

const secondaryNavigation = [
  { name: 'Paramètres', href: '/admin/settings', icon: Settings },
];

export const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Clock Pilot</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
            {item.badge && (
              <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                {item.badge}
              </Badge>
            )}
          </NavLink>
        ))}

        {/* Separator */}
        <div className="border-t border-sidebar-border my-4"></div>

        {secondaryNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
};