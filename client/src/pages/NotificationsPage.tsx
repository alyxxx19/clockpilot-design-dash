import React from 'react';
import { NotificationList } from '@/components/NotificationList';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

export function NotificationsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-center text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos notifications et préférences
          </p>
        </div>
      </div>

      <NotificationList showHeader={false} maxHeight="calc(100vh - 200px)" />
    </div>
  );
}