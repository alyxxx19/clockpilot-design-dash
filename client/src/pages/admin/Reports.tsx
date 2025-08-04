import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExportButton } from '@/components/ExportButton';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Users, 
  Calendar,
  Clock,
  TrendingUp,
  Building2
} from 'lucide-react';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
}

export function Reports() {
  // Fetch employees for export filters
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Get unique departments
  const departments = Array.from(new Set(employees.map(emp => emp.department))).filter(Boolean);

  const reportCards = [
    {
      title: 'Planning d\'équipe',
      description: 'Export complet du planning avec horaires et affectations',
      icon: Calendar,
      stats: { count: employees.length, label: 'employés' },
      color: 'blue'
    },
    {
      title: 'Feuilles de temps',
      description: 'Pointages et heures travaillées pour chaque employé',
      icon: Clock,
      stats: { count: '2.3k', label: 'entrées ce mois' },
      color: 'green'
    },
    {
      title: 'Rapports RH',
      description: 'Analyses mensuelles avec statistiques détaillées',
      icon: TrendingUp,
      stats: { count: departments.length, label: 'départements' },
      color: 'purple'
    },
    {
      title: 'Attestations',
      description: 'Documents officiels avec signatures électroniques',
      icon: FileSpreadsheet,
      stats: { count: '100%', label: 'conformité' },
      color: 'orange'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Rapports & Exports
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Générez et exportez vos données en Excel ou PDF
          </p>
        </div>
        
        {/* Main Export Button */}
        <ExportButton
          employees={employees}
          departments={departments}
          variant="default"
          size="lg"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
            green: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
            purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
            orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300'
          };
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-2 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]} mb-3`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {card.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {card.stats.count}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {card.stats.label}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Exports rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <h4 className="font-medium">Planning de la semaine</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export automatique des 7 prochains jours
                  </p>
                </div>
                <ExportButton
                  variant="outline"
                  size="sm"
                  employees={employees}
                  departments={departments}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <h4 className="font-medium">Feuilles de temps du mois</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tous les pointages du mois en cours
                  </p>
                </div>
                <ExportButton
                  variant="outline"
                  size="sm"
                  employees={employees}
                  departments={departments}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <h4 className="font-medium">Rapport mensuel RH</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Statistiques complètes avec graphiques
                  </p>
                </div>
                <ExportButton
                  variant="outline"
                  size="sm"
                  employees={employees}
                  departments={departments}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistiques d'export
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Exports ce mois
                </span>
                <Badge variant="secondary">24</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Format le plus utilisé
                </span>
                <Badge variant="default">Excel</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Taille moyenne
                </span>
                <Badge variant="outline">2.1 MB</Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Temps de génération moyen
                </span>
                <Badge variant="outline">3.2s</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Départements actifs</h4>
              <div className="flex flex-wrap gap-2">
                {departments.slice(0, 4).map(dept => (
                  <Badge key={dept} variant="secondary" className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {dept}
                  </Badge>
                ))}
                {departments.length > 4 && (
                  <Badge variant="outline">
                    +{departments.length - 4} autres
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Aide et conseils</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Formats disponibles</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exportez vos données en Excel (.xlsx) pour l'analyse ou en PDF (.pdf) pour l'archivage et l'impression.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Filtres avancés</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utilisez les filtres par département, employé ou période pour obtenir exactement les données dont vous avez besoin.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Conformité RGPD</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tous les exports respectent les réglementations de protection des données et incluent uniquement les informations autorisées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Reports;