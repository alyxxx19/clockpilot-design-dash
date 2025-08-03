import React from 'react';
import { Clock, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
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

        {/* Spacer */}
        <div className="flex-1"></div>

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

      {/* Main Content */}
      <main className="ml-64 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Dashboard Administrateur
            </h1>
            <p className="text-muted-foreground">
              Dashboard en cours de développement
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Les fonctionnalités d'administration seront disponibles prochainement.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};