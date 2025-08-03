import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useExport, type ExportOptions } from '@/hooks/useExport';

interface ExportButtonProps {
  type: 'planning' | 'time-entries' | 'reports';
  options?: Partial<ExportOptions>;
  className?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  type,
  options = {},
  className,
  disabled = false
}) => {
  const { exportProgress, exportPlanning, exportTimeEntries, exportReports } = useExport();
  const [showProgress, setShowProgress] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf') => {
    const exportOptions: ExportOptions = {
      format,
      ...options
    };

    setShowProgress(true);

    try {
      switch (type) {
        case 'planning':
          await exportPlanning(exportOptions);
          break;
        case 'time-entries':
          await exportTimeEntries(exportOptions);
          break;
        case 'reports':
          await exportReports(exportOptions);
          break;
      }
    } finally {
      setTimeout(() => setShowProgress(false), 1000);
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'planning':
        return 'Planning';
      case 'time-entries':
        return 'Saisies de temps';
      case 'reports':
        return 'Rapports';
      default:
        return 'Données';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={className}
            disabled={disabled || exportProgress.isExporting}
            data-testid={`button-export-${type}`}
          >
            {exportProgress.isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => handleExport('excel')}
            disabled={exportProgress.isExporting}
            data-testid={`menuitem-export-excel-${type}`}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporter en Excel
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => handleExport('pdf')}
            disabled={exportProgress.isExporting}
            data-testid={`menuitem-export-pdf-${type}`}
          >
            <FileText className="w-4 h-4 mr-2" />
            Exporter en PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export en cours</DialogTitle>
            <DialogDescription>
              Export des {getTypeLabel().toLowerCase()} au format {options.format?.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{exportProgress.stage}</span>
                <span>{exportProgress.progress}%</span>
              </div>
              <Progress value={exportProgress.progress} className="w-full" />
            </div>
            
            {exportProgress.progress === 100 && (
              <div className="text-center text-sm text-green-600">
                Export terminé avec succès !
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};