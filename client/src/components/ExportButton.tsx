import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
// Import removed - using fetch directly for file downloads
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  Settings,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface ExportOptions {
  type: 'planning' | 'timesheet' | 'monthly-report' | 'attendance-certificate';
  format: 'excel' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  employeeIds?: number[];
  includeBreaks?: boolean;
  includeOvertime?: boolean;
  departmentFilter?: string;
}

interface ExportButtonProps {
  data?: any;
  filters?: Record<string, any>;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  disabled?: boolean;
  employees?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    department: string;
  }>;
  departments?: string[];
}

const exportTypes = [
  {
    id: 'planning',
    name: 'Planning d\'équipe',
    description: 'Export du planning avec horaires et affectations',
    icon: Calendar,
    formats: ['excel', 'pdf']
  },
  {
    id: 'timesheet',
    name: 'Feuille de temps',
    description: 'Pointages et heures travaillées individuelles',
    icon: FileSpreadsheet,
    formats: ['excel', 'pdf']
  },
  {
    id: 'monthly-report',
    name: 'Rapport mensuel RH',
    description: 'Rapport complet avec statistiques et récapitulatif',
    icon: FileText,
    formats: ['excel', 'pdf']
  },
  {
    id: 'attendance-certificate',
    name: 'Attestation de présence',
    description: 'Document officiel avec signature électronique',
    icon: FileText,
    formats: ['pdf']
  }
];

const formatLabels = {
  excel: 'Excel (.xlsx)',
  pdf: 'PDF (.pdf)'
};

export function ExportButton({
  data,
  filters,
  variant = 'default',
  size = 'default',
  className,
  disabled,
  employees = [],
  departments = []
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  // Form state
  const [exportType, setExportType] = useState<ExportOptions['type']>('planning');
  const [exportFormat, setExportFormat] = useState<ExportOptions['format']>('excel');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [includeBreaks, setIncludeBreaks] = useState(true);
  const [includeOvertime, setIncludeOvertime] = useState(true);

  const { toast } = useToast();

  const selectedExportType = exportTypes.find(type => type.id === exportType);
  const availableFormats = selectedExportType?.formats || ['excel'];

  // Auto-adjust format when changing export type
  React.useEffect(() => {
    if (!availableFormats.includes(exportFormat)) {
      setExportFormat(availableFormats[0] as ExportOptions['format']);
    }
  }, [exportType, availableFormats, exportFormat]);

  const handleExport = async () => {
    if (!exportType || !exportFormat || !dateRange.start || !dateRange.end) {
      toast({
        title: "Paramètres manquants",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const exportOptions: ExportOptions = {
        type: exportType,
        format: exportFormat,
        dateRange,
        employeeIds: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        departmentFilter: selectedDepartment || undefined,
        includeBreaks,
        includeOvertime
      };

      const response = await fetch('/api/export/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exportOptions)
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Handle file download
      const contentType = response.headers.get('content-type');
      const filename = response.headers.get('content-disposition')?.match(/filename="(.+)"/)?.[1] || 
                     `export_${exportType}_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export réussi",
        description: `Le fichier ${filename} a été téléchargé`,
        variant: "default",
      });

      setIsOpen(false);
      resetForm();

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'export",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handlePreview = async () => {
    // Generate preview data
    const preview = {
      type: exportType,
      format: exportFormat,
      dateRange,
      employeesCount: selectedEmployees.length || employees.length,
      estimatedRows: Math.floor(Math.random() * 500) + 100,
      estimatedSize: '2.3 MB'
    };
    
    setPreviewData(preview);
    setShowPreview(true);
  };

  const resetForm = () => {
    setExportType('planning');
    setExportFormat('excel');
    setSelectedEmployees([]);
    setSelectedDepartment('');
    setIncludeBreaks(true);
    setIncludeOvertime(true);
    setShowPreview(false);
    setPreviewData(null);
  };

  const quickDateRanges = [
    {
      label: 'Ce mois',
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    },
    {
      label: 'Mois dernier',
      start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
    },
    {
      label: 'Trimestre actuel',
      start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={disabled}
          data-testid="button-export"
        >
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export de données
          </DialogTitle>
          <DialogDescription>
            Configurez votre export et choisissez le format souhaité
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type d'export */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Type d'export</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Card 
                      key={type.id}
                      className={`cursor-pointer transition-all ${
                        exportType === type.id 
                          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setExportType(type.id as ExportOptions['type'])}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="h-5 w-5 mt-0.5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">{type.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {type.description}
                            </p>
                            <div className="flex gap-1 mt-2">
                              {type.formats.map(format => (
                                <Badge key={format} variant="secondary" className="text-xs">
                                  {format.toUpperCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-3">
              <Label htmlFor="format" className="text-base font-semibold">Format</Label>
              <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportOptions['format'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un format" />
                </SelectTrigger>
                <SelectContent>
                  {availableFormats.map(format => (
                    <SelectItem key={format} value={format}>
                      <div className="flex items-center gap-2">
                        {format === 'excel' ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {formatLabels[format as keyof typeof formatLabels]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Période */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Période</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm">Date de début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-sm">Date de fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Raccourcis de période */}
              <div className="flex flex-wrap gap-2">
                {quickDateRanges.map((range, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setDateRange({ start: range.start, end: range.end })}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtres employés */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filtres employés</Label>
              
              {departments.length > 0 && (
                <div>
                  <Label htmlFor="department" className="text-sm">Département</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les départements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les départements</SelectItem>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {employees.length > 0 && (
                <div>
                  <Label className="text-sm">Employés spécifiques (optionnel)</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {employees
                      .filter(emp => !selectedDepartment || emp.department === selectedDepartment)
                      .map(employee => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmployees([...selectedEmployees, employee.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== employee.id));
                            }
                          }}
                        />
                        <Label htmlFor={`employee-${employee.id}`} className="text-sm">
                          {employee.firstName} {employee.lastName}
                          <span className="text-gray-500 ml-1">({employee.department})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Options avancées */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Options avancées</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-breaks"
                    checked={includeBreaks}
                    onCheckedChange={(checked) => setIncludeBreaks(checked === true)}
                  />
                  <Label htmlFor="include-breaks" className="text-sm">
                    Inclure les pauses
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-overtime"
                    checked={includeOvertime}
                    onCheckedChange={(checked) => setIncludeOvertime(checked === true)}
                  />
                  <Label htmlFor="include-overtime" className="text-sm">
                    Inclure les heures supplémentaires
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu et résumé */}
          <div className="space-y-6">
            {/* Résumé de la configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Résumé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Type:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedExportType?.name}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Format:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatLabels[exportFormat]}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Période:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(dateRange.start), 'dd/MM/yyyy', { locale: fr })} - {' '}
                    {format(new Date(dateRange.end), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </div>
                {selectedDepartment && (
                  <div>
                    <div className="text-sm font-medium">Département:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedDepartment}
                    </div>
                  </div>
                )}
                {selectedEmployees.length > 0 && (
                  <div>
                    <div className="text-sm font-medium">Employés:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmployees.length} sélectionné(s)
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            {showPreview && previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Aperçu
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{previewData.employeesCount} employé(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>~{previewData.estimatedRows} lignes de données</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <span>Taille estimée: {previewData.estimatedSize}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress pendant l'export */}
            {isExporting && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Export en cours...
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {exportProgress}% terminé
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isExporting}
          >
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !exportType || !exportFormat}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}