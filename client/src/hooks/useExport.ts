import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ExportOptions {
  format: 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  employeeIds?: string[];
  type?: string;
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number;
  stage: string;
}

export const useExport = () => {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    stage: ''
  });
  
  const { toast } = useToast();

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPlanning = async (options: ExportOptions) => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 10,
        stage: 'Préparation des données...'
      });

      const params = new URLSearchParams();
      params.append('format', options.format);
      
      if (options.dateRange) {
        params.append('date_from', options.dateRange.start);
        params.append('date_to', options.dateRange.end);
      }
      
      if (options.employeeIds && options.employeeIds.length > 0) {
        options.employeeIds.forEach(id => params.append('employee_ids', id));
      }

      setExportProgress({
        isExporting: true,
        progress: 50,
        stage: 'Génération du fichier...'
      });

      const response = await fetch(`/api/planning/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      setExportProgress({
        isExporting: true,
        progress: 90,
        stage: 'Téléchargement...'
      });

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                     `planning-${options.format}-${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      downloadFile(blob, filename);

      setExportProgress({
        isExporting: false,
        progress: 100,
        stage: 'Terminé'
      });

      toast({
        title: "Export réussi",
        description: `Le planning a été exporté au format ${options.format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Export planning error:', error);
      setExportProgress({
        isExporting: false,
        progress: 0,
        stage: ''
      });
      
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le planning. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const exportTimeEntries = async (options: ExportOptions) => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 10,
        stage: 'Préparation des données...'
      });

      const params = new URLSearchParams();
      params.append('format', options.format);
      
      if (options.dateRange) {
        params.append('date_from', options.dateRange.start);
        params.append('date_to', options.dateRange.end);
      }
      
      if (options.employeeIds && options.employeeIds.length > 0) {
        options.employeeIds.forEach(id => params.append('employee_ids', id));
      }

      setExportProgress({
        isExporting: true,
        progress: 50,
        stage: 'Génération du fichier...'
      });

      const response = await fetch(`/api/time-entries/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      setExportProgress({
        isExporting: true,
        progress: 90,
        stage: 'Téléchargement...'
      });

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                     `time-entries-${options.format}-${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      downloadFile(blob, filename);

      setExportProgress({
        isExporting: false,
        progress: 100,
        stage: 'Terminé'
      });

      toast({
        title: "Export réussi",
        description: `Les saisies de temps ont été exportées au format ${options.format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Export time entries error:', error);
      setExportProgress({
        isExporting: false,
        progress: 0,
        stage: ''
      });
      
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les saisies de temps. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const exportReports = async (options: ExportOptions) => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 10,
        stage: 'Préparation des données...'
      });

      const params = new URLSearchParams();
      params.append('format', options.format);
      
      if (options.type) {
        params.append('type', options.type);
      }
      
      if (options.dateRange) {
        params.append('date_from', options.dateRange.start);
        params.append('date_to', options.dateRange.end);
      }

      setExportProgress({
        isExporting: true,
        progress: 50,
        stage: 'Génération du fichier...'
      });

      const response = await fetch(`/api/reports/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      setExportProgress({
        isExporting: true,
        progress: 90,
        stage: 'Téléchargement...'
      });

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
                     `reports-${options.format}-${new Date().toISOString().split('T')[0]}.${options.format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      downloadFile(blob, filename);

      setExportProgress({
        isExporting: false,
        progress: 100,
        stage: 'Terminé'
      });

      toast({
        title: "Export réussi",
        description: `Les rapports ont été exportés au format ${options.format.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Export reports error:', error);
      setExportProgress({
        isExporting: false,
        progress: 0,
        stage: ''
      });
      
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les rapports. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return {
    exportProgress,
    exportPlanning,
    exportTimeEntries,
    exportReports
  };
};