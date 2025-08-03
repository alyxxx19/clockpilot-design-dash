import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, RefreshCw } from 'lucide-react';

// Simpler example without complex imports
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const SimpleQueryExample: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Simple employees query
  const { 
    data: employees, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['employees', 'simple'],
    queryFn: () => apiClient.get('/api/employees?limit=5'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Simple mutation example
  const refreshMutation = useMutation({
    mutationFn: () => apiClient.get('/api/employees?limit=5'),
    onSuccess: (data) => {
      queryClient.setQueryData(['employees', 'simple'], data);
      toast({
        title: "Données actualisées",
        description: "Liste des employés mise à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          React Query - Exemple Simple
          {(isLoading || refreshMutation.isPending) && (
            <RefreshCw className="h-4 w-4 animate-spin" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        ) : error ? (
          <div className="text-destructive p-4 border border-destructive/20 rounded">
            Erreur: {error instanceof Error ? error.message : 'Une erreur est survenue'}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {employees?.data?.slice(0, 3).map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                    <p className="text-sm text-muted-foreground">{employee.userEmail}</p>
                  </div>
                  <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                    {employee.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              )) || <p className="text-muted-foreground">Aucun employé trouvé</p>}
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-muted-foreground">
                Total: {employees?.pagination?.total || 0} employés
              </span>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  Refetch
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refreshMutation.mutate()}
                  disabled={refreshMutation.isPending}
                >
                  Mutation
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded">
              <p><strong>React Query Features démontrées:</strong></p>
              <p>• Cache automatique (5 minutes)</p>
              <p>• Retry automatique (3 tentatives)</p>
              <p>• Loading et error states</p>
              <p>• Refetch manuel et par mutation</p>
              <p>• Cache invalidation</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};