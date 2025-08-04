import ExcelJS from 'exceljs';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Font } from '@react-pdf/renderer';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Response } from 'express';

// Types for export data
export interface ExportEmployee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  contractType: string;
  weeklyHours: number;
}

export interface ExportTimeEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  clockIn: string;
  clockOut?: string;
  type: 'work' | 'break';
  duration: number;
  date: string;
}

export interface ExportPlanningEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  startTime: string;
  endTime: string;
  type: 'work' | 'break' | 'vacation' | 'sick';
  status: 'planned' | 'validated' | 'rejected';
  date: string;
}

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

export class ExportService {
  
  // Generate Excel export
  async generateExcelExport(
    data: {
      employees: ExportEmployee[];
      timeEntries: ExportTimeEntry[];
      planningEntries: ExportPlanningEntry[];
    },
    options: ExportOptions,
    res: Response
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'ClockPilot';
    workbook.lastModifiedBy = 'ClockPilot';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    switch (options.type) {
      case 'planning':
        await this.createPlanningSheet(workbook, data, options);
        break;
      case 'timesheet':
        await this.createTimesheetSheet(workbook, data, options);
        break;
      case 'monthly-report':
        await this.createMonthlyReportSheet(workbook, data, options);
        break;
      case 'attendance-certificate':
        await this.createAttendanceCertificateSheet(workbook, data, options);
        break;
    }
    
    // Set response headers
    const filename = this.generateFilename(options, 'xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Write to response
    await workbook.xlsx.write(res);
  }

  // Create planning sheet
  private async createPlanningSheet(
    workbook: ExcelJS.Workbook,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Planning', {
      pageSetup: { orientation: 'landscape', fitToPage: true }
    });

    // Add title
    worksheet.mergeCells('A1:H2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Planning des Équipes';
    titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

    // Add period info
    worksheet.mergeCells('A3:H3');
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `Période: ${format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}`;
    periodCell.font = { name: 'Arial', size: 12, italic: true };
    periodCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = ['Employé', 'Département', 'Date', 'Heure Début', 'Heure Fin', 'Type', 'Durée', 'Statut'];
    const headerRow = worksheet.getRow(5);
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Data rows
    let rowIndex = 6;
    data.planningEntries.forEach((entry: ExportPlanningEntry) => {
      const employee = data.employees.find((e: ExportEmployee) => e.id === entry.employeeId);
      const row = worksheet.getRow(rowIndex);
      
      const duration = this.calculateDuration(entry.startTime, entry.endTime);
      const statusText = this.getStatusText(entry.status);
      const typeText = this.getTypeText(entry.type);
      
      row.values = [
        `${employee?.firstName} ${employee?.lastName}`,
        employee?.department,
        format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }),
        format(new Date(entry.startTime), 'HH:mm'),
        format(new Date(entry.endTime), 'HH:mm'),
        typeText,
        duration,
        statusText
      ];

      // Apply styling
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        
        // Color code by status
        if (colNumber === 8) { // Status column
          switch (entry.status) {
            case 'validated':
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
              break;
            case 'rejected':
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
              break;
            default:
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          }
        }
      });
      
      rowIndex++;
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Set specific column widths
    worksheet.getColumn(1).width = 20; // Employee name
    worksheet.getColumn(2).width = 18; // Department
    worksheet.getColumn(7).width = 12; // Duration
  }

  // Create timesheet sheet
  private async createTimesheetSheet(
    workbook: ExcelJS.Workbook,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Feuille de Temps', {
      pageSetup: { orientation: 'landscape', fitToPage: true }
    });

    // Title
    worksheet.mergeCells('A1:I2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Feuille de Temps';
    titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF059669' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    worksheet.mergeCells('A3:I3');
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `Période: ${format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}`;
    periodCell.font = { name: 'Arial', size: 12, italic: true };
    periodCell.alignment = { horizontal: 'center' };

    // Headers
    const headers = ['Employé', 'Date', 'Heure Entrée', 'Heure Sortie', 'Pause', 'Temps Travaillé', 'Heures Sup.', 'Type', 'Statut'];
    const headerRow = worksheet.getRow(5);
    
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Group entries by employee and date
    const groupedEntries = this.groupTimeEntriesByEmployeeAndDate(data.timeEntries);
    
    let rowIndex = 6;
    Object.entries(groupedEntries).forEach(([employeeId, dateEntries]) => {
      const employee = data.employees.find((e: ExportEmployee) => e.id === parseInt(employeeId));
      
      Object.entries(dateEntries as any).forEach(([date, entries]) => {
        const workEntries = (entries as ExportTimeEntry[]).filter(e => e.type === 'work');
        const breakEntries = (entries as ExportTimeEntry[]).filter(e => e.type === 'break');
        
        if (workEntries.length > 0) {
          const firstEntry = workEntries[0];
          const lastEntry = workEntries[workEntries.length - 1];
          
          const totalWorkTime = workEntries.reduce((sum, entry) => sum + entry.duration, 0);
          const totalBreakTime = breakEntries.reduce((sum, entry) => sum + entry.duration, 0);
          const overtimeHours = Math.max(0, totalWorkTime - (employee?.weeklyHours || 35) / 5);
          
          const row = worksheet.getRow(rowIndex);
          row.values = [
            `${employee?.firstName} ${employee?.lastName}`,
            format(new Date(date), 'dd/MM/yyyy', { locale: fr }),
            firstEntry.clockIn ? format(new Date(firstEntry.clockIn), 'HH:mm') : '',
            lastEntry.clockOut ? format(new Date(lastEntry.clockOut), 'HH:mm') : 'En cours',
            this.formatDuration(totalBreakTime),
            this.formatDuration(totalWorkTime),
            this.formatDuration(overtimeHours),
            'Travail',
            lastEntry.clockOut ? 'Terminé' : 'En cours'
          ];

          // Apply styling
          row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Arial', size: 10 };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Highlight overtime
            if (colNumber === 7 && overtimeHours > 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };
            }
          });
          
          rowIndex++;
        }
      });
    });

    // Summary section
    const summaryStartRow = rowIndex + 2;
    worksheet.mergeCells(`A${summaryStartRow}:I${summaryStartRow}`);
    const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
    summaryTitleCell.value = 'Récapitulatif';
    summaryTitleCell.font = { name: 'Arial', size: 14, bold: true };
    summaryTitleCell.alignment = { horizontal: 'center' };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  // Create monthly report sheet
  private async createMonthlyReportSheet(
    workbook: ExcelJS.Workbook,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    // Main summary sheet
    const summarySheet = workbook.addWorksheet('Récapitulatif Mensuel');
    
    // Planning sheet
    await this.createPlanningSheet(workbook, data, options);
    
    // Timesheet sheet
    await this.createTimesheetSheet(workbook, data, options);
    
    // Create summary sheet content
    summarySheet.mergeCells('A1:F2');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Rapport Mensuel RH';
    titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FF7C3AED' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Month info
    const month = format(new Date(options.dateRange.start), 'MMMM yyyy', { locale: fr });
    summarySheet.mergeCells('A3:F3');
    const monthCell = summarySheet.getCell('A3');
    monthCell.value = month.charAt(0).toUpperCase() + month.slice(1);
    monthCell.font = { name: 'Arial', size: 14, italic: true };
    monthCell.alignment = { horizontal: 'center' };

    // Statistics
    const stats = this.calculateMonthlyStats(data);
    
    const statsHeaders = ['Métrique', 'Valeur'];
    const statsData = [
      ['Nombre d\'employés', stats.totalEmployees],
      ['Heures totales travaillées', this.formatDuration(stats.totalHours)],
      ['Heures supplémentaires', this.formatDuration(stats.overtimeHours)],
      ['Jours de congé', stats.vacationDays],
      ['Absences maladie', stats.sickDays],
      ['Taux de présence', `${stats.attendanceRate}%`]
    ];

    let rowIndex = 6;
    
    // Stats headers
    const statsHeaderRow = summarySheet.getRow(rowIndex);
    statsHeaders.forEach((header, index) => {
      const cell = statsHeaderRow.getCell(index + 2); // Start from column B
      cell.value = header;
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    rowIndex++;

    // Stats data
    statsData.forEach(([metric, value]) => {
      const row = summarySheet.getRow(rowIndex);
      row.values = ['', metric, value];
      row.eachCell((cell, colNumber) => {
        if (colNumber >= 2) {
          cell.font = { name: 'Arial', size: 11 };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      });
      rowIndex++;
    });

    // Auto-fit columns
    summarySheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  // Create attendance certificate sheet
  private async createAttendanceCertificateSheet(
    workbook: ExcelJS.Workbook,
    data: any,
    options: ExportOptions
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Attestation de Présence');

    // Header with company info
    worksheet.mergeCells('A1:E3');
    const companyCell = worksheet.getCell('A1');
    companyCell.value = 'ATTESTATION DE PRÉSENCE\n\nEntreprise: ClockPilot SAS\nAdresse: 123 Rue de la Technologie, 75001 Paris';
    companyCell.font = { name: 'Arial', size: 14, bold: true };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    let rowIndex = 6;
    
    // For each employee, create a certificate
    data.employees.forEach((employee: ExportEmployee) => {
      const employeeTimeEntries = data.timeEntries.filter(
        (entry: ExportTimeEntry) => entry.employeeId === employee.id
      );
      
      if (employeeTimeEntries.length > 0) {
        // Employee info
        worksheet.mergeCells(`A${rowIndex}:E${rowIndex + 1}`);
        const employeeInfoCell = worksheet.getCell(`A${rowIndex}`);
        employeeInfoCell.value = `Je soussigné(e), certifie que:\n${employee.firstName} ${employee.lastName}\nPoste: ${employee.position}\nDépartement: ${employee.department}`;
        employeeInfoCell.font = { name: 'Arial', size: 12 };
        employeeInfoCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        
        rowIndex += 3;

        // Period and hours
        const totalHours = employeeTimeEntries.reduce((sum, entry) => sum + entry.duration, 0);
        
        worksheet.mergeCells(`A${rowIndex}:E${rowIndex + 2}`);
        const hoursCell = worksheet.getCell(`A${rowIndex}`);
        hoursCell.value = `A bien été présent(e) du ${format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}\n\nNombre total d'heures travaillées: ${this.formatDuration(totalHours)}\nType de contrat: ${employee.contractType}`;
        hoursCell.font = { name: 'Arial', size: 11 };
        hoursCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        
        rowIndex += 4;

        // Signature section
        worksheet.mergeCells(`A${rowIndex}:B${rowIndex + 3}`);
        const signatureCell = worksheet.getCell(`A${rowIndex}`);
        signatureCell.value = `Fait à Paris, le ${format(new Date(), 'dd/MM/yyyy', { locale: fr })}\n\nSignature de l'employeur:\n\n\n_________________________`;
        signatureCell.font = { name: 'Arial', size: 10 };
        signatureCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        
        worksheet.mergeCells(`D${rowIndex}:E${rowIndex + 3}`);
        const employeeSignatureCell = worksheet.getCell(`D${rowIndex}`);
        employeeSignatureCell.value = `Signature de l'employé(e):\n\n\n\n_________________________`;
        employeeSignatureCell.font = { name: 'Arial', size: 10 };
        employeeSignatureCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        
        rowIndex += 6;

        // Page break between employees
        if (data.employees.indexOf(employee) < data.employees.length - 1) {
          worksheet.addRow([]);
          worksheet.addRow(['═'.repeat(50)]);
          worksheet.addRow([]);
          rowIndex += 3;
        }
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  // Helper methods
  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }

  private getStatusText(status: string): string {
    const statusMap = {
      'planned': 'Planifié',
      'validated': 'Validé',
      'rejected': 'Rejeté'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  private getTypeText(type: string): string {
    const typeMap = {
      'work': 'Travail',
      'break': 'Pause',
      'vacation': 'Congé',
      'sick': 'Maladie'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  }

  private groupTimeEntriesByEmployeeAndDate(timeEntries: ExportTimeEntry[]): Record<string, Record<string, ExportTimeEntry[]>> {
    return timeEntries.reduce((acc, entry) => {
      const employeeKey = entry.employeeId.toString();
      const dateKey = entry.date;
      
      if (!acc[employeeKey]) {
        acc[employeeKey] = {};
      }
      
      if (!acc[employeeKey][dateKey]) {
        acc[employeeKey][dateKey] = [];
      }
      
      acc[employeeKey][dateKey].push(entry);
      return acc;
    }, {} as Record<string, Record<string, ExportTimeEntry[]>>);
  }

  private calculateMonthlyStats(data: any) {
    const totalEmployees = data.employees.length;
    const totalHours = data.timeEntries.reduce((sum: number, entry: ExportTimeEntry) => sum + entry.duration, 0);
    const overtimeHours = Math.max(0, totalHours - (totalEmployees * 160)); // Assuming 160h/month standard
    
    const planningEntries = data.planningEntries || [];
    const vacationDays = planningEntries.filter((entry: ExportPlanningEntry) => entry.type === 'vacation').length;
    const sickDays = planningEntries.filter((entry: ExportPlanningEntry) => entry.type === 'sick').length;
    
    const workingDays = 22; // Average working days per month
    const expectedHours = totalEmployees * workingDays * 8;
    const attendanceRate = Math.round((totalHours / expectedHours) * 100);
    
    return {
      totalEmployees,
      totalHours,
      overtimeHours,
      vacationDays,
      sickDays,
      attendanceRate
    };
  }

  private generateFilename(options: ExportOptions, extension: string): string {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const typeStr = options.type.replace('-', '_');
    return `clockpilot_${typeStr}_${dateStr}.${extension}`;
  }
}

export const exportService = new ExportService();