import { Response } from 'express';
import xlsx from 'xlsx';
import puppeteer from 'puppeteer';
import { DatabaseStorage } from './storage';

export interface ExportOptions {
  format: 'excel' | 'pdf';
  period?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  employeeIds?: number[];
  projectIds?: number[];
  includeStats?: boolean;
  includeCharts?: boolean;
}

export interface CompanyInfo {
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  siret?: string;
}

export class ExportService {
  private storage: DatabaseStorage;
  
  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // ============================================================================
  // PLANNING EXPORTS
  // ============================================================================

  async exportPlanning(options: ExportOptions, res: Response): Promise<void> {
    const { format, period = 'week', startDate, endDate, employeeIds } = options;
    
    // Calculate date range
    const dates = this.calculateDateRange(period, startDate, endDate);
    
    // Fetch planning data
    const planningData = await this.fetchPlanningData({
      dateFrom: dates.start,
      dateTo: dates.end,
      employeeIds
    });

    if (format === 'excel') {
      await this.exportPlanningExcel(planningData, dates, res);
    } else {
      await this.exportPlanningPDF(planningData, dates, res);
    }
  }

  private async exportPlanningExcel(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string },
    res: Response
  ): Promise<void> {
    const workbook = xlsx.utils.book_new();
    
    // Create summary sheet
    const summaryData = this.preparePlanningSummary(data, dates);
    const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Generate buffer and send
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="planning_${dates.start}_${dates.end}.xlsx"`);
    res.send(buffer);
  }

  private async exportPlanningPDF(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string },
    res: Response
  ): Promise<void> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const html = this.generatePlanningHTML(data, dates);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="planning_${dates.start}_${dates.end}.pdf"`);
    res.send(pdf);
  }

  // ============================================================================
  // TIME ENTRIES EXPORTS
  // ============================================================================

  async exportTimeEntries(options: ExportOptions, res: Response): Promise<void> {
    const { format, startDate, endDate, employeeIds, projectIds } = options;
    
    const dates = this.calculateDateRange('month', startDate, endDate);
    
    const timeData = await this.fetchTimeEntriesData({
      dateFrom: dates.start,
      dateTo: dates.end,
      employeeIds,
      projectIds
    });

    if (format === 'excel') {
      await this.exportTimeEntriesExcel(timeData, dates, res);
    } else {
      await this.exportTimeEntriesPDF(timeData, dates, res);
    }
  }

  private async exportTimeEntriesExcel(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string },
    res: Response
  ): Promise<void> {
    const workbook = xlsx.utils.book_new();
    
    // Payroll format sheet
    const payrollData = this.preparePayrollData(data, dates);
    const payrollSheet = xlsx.utils.aoa_to_sheet(payrollData);
    xlsx.utils.book_append_sheet(workbook, payrollSheet, 'Paie');

    // Summary sheet
    const summaryData = this.prepareTimeEntriesSummary(data, dates);
    const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="temps_${dates.start}_${dates.end}.xlsx"`);
    res.send(buffer);
  }

  private async exportTimeEntriesPDF(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string },
    res: Response
  ): Promise<void> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const html = this.generateTimeEntriesHTML(data, dates);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="temps_${dates.start}_${dates.end}.pdf"`);
    res.send(pdf);
  }

  // ============================================================================
  // MONTHLY REPORTS
  // ============================================================================

  async exportMonthlyReport(
    employeeId: number, 
    month: string, 
    options: ExportOptions,
    res: Response
  ): Promise<void> {
    const { format = 'pdf' } = options;
    
    const dates = this.calculateMonthRange(month);
    const reportData = await this.fetchMonthlyReportData(employeeId, dates);

    if (format === 'excel') {
      await this.exportMonthlyReportExcel(reportData, res);
    } else {
      await this.exportMonthlyReportPDF(reportData, res);
    }
  }

  private async exportMonthlyReportExcel(
    data: {
      employee: any,
      timeEntries: any[],
      planningEntries: any[],
      projects: any[],
      stats: any
    },
    res: Response
  ): Promise<void> {
    const workbook = xlsx.utils.book_new();
    
    const reportData = [
      [`Rapport Mensuel - ${data.employee.first_name} ${data.employee.last_name}`],
      [`Période: ${data.stats.month}`],
      [''],
      ['Métriques', 'Valeur'],
      ['Total Heures Travaillées', data.stats.totalHours.toFixed(1)],
      ['Heures Supplémentaires', data.stats.overtimeHours.toFixed(1)],
      ['Jours Travaillés', data.stats.workDays],
      ['Projets', data.stats.projectCount]
    ];

    const reportSheet = xlsx.utils.aoa_to_sheet(reportData);
    xlsx.utils.book_append_sheet(workbook, reportSheet, 'Rapport');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const fileName = `rapport_${data.employee.first_name}_${data.employee.last_name}_${data.stats.month}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  private async exportMonthlyReportPDF(
    data: {
      employee: any,
      timeEntries: any[],
      planningEntries: any[],
      projects: any[],
      stats: any
    },
    res: Response
  ): Promise<void> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    const html = this.generateMonthlyReportHTML(data);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: this.getPDFHeader(),
      footerTemplate: this.getPDFFooter()
    });
    
    await browser.close();
    
    const fileName = `rapport_${data.employee.first_name}_${data.employee.last_name}_${data.stats.month}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdf);
  }

  // ============================================================================
  // DATA PREPARATION METHODS
  // ============================================================================

  private async fetchPlanningData(filters: {
    dateFrom: string,
    dateTo: string,
    employeeIds?: number[]
  }) {
    const entries = await this.storage.getPlanningEntries({
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      employeeId: filters.employeeIds?.[0],
      limit: 1000,
      offset: 0
    });

    return {
      entries,
      employees: [],
      projects: []
    };
  }

  private async fetchTimeEntriesData(filters: {
    dateFrom: string,
    dateTo: string,
    employeeIds?: number[],
    projectIds?: number[]
  }) {
    const entries = await this.storage.getTimeEntries({
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      employeeId: filters.employeeIds?.[0],
      projectId: filters.projectIds?.[0],
      limit: 2000,
      offset: 0
    });

    return {
      entries: entries.data,
      employees: [],
      projects: []
    };
  }

  private async fetchMonthlyReportData(employeeId: number, dates: { start: string, end: string }) {
    const employee = await this.storage.getEmployee(employeeId);
    if (!employee) throw new Error('Employee not found');

    const timeEntries = await this.storage.getTimeEntries({
      employeeId: employeeId,
      dateFrom: dates.start,
      dateTo: dates.end,
      limit: 1000,
      offset: 0
    });

    const planningEntries = await this.storage.getPlanningEntries({
      employeeId: employeeId,
      startDate: dates.start,
      endDate: dates.end,
      limit: 1000,
      offset: 0
    });

    const stats = this.calculateMonthlyStats(timeEntries.data, planningEntries);

    return {
      employee,
      timeEntries: timeEntries.data,
      planningEntries: planningEntries,
      projects: [],
      stats
    };
  }

  // ============================================================================
  // FORMATTING METHODS
  // ============================================================================

  private preparePlanningSummary(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string }
  ): any[][] {
    const companyInfo = this.getCompanyInfo();
    
    return [
      [`${companyInfo.name} - Planning Export`],
      [`Période: ${dates.start} au ${dates.end}`],
      [''],
      ['Date', 'Employé', 'Début', 'Fin', 'Type', 'Statut'],
      ...data.entries.map(entry => [
        entry.date,
        `Employé ${entry.employee_id}`,
        entry.start_time || 'N/A',
        entry.end_time || 'N/A',
        entry.type,
        entry.status
      ])
    ];
  }

  private preparePayrollData(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string }
  ): any[][] {
    const companyInfo = this.getCompanyInfo();
    
    const headers = [
      [`${companyInfo.name} - Feuille de Paie`],
      [`Période: ${dates.start} au ${dates.end}`],
      [''],
      ['Date', 'Employé', 'Début', 'Fin', 'Durée (h)', 'Type', 'Description']
    ];

    const payrollRows = data.entries.map(entry => {
      let duration = 0;
      if (entry.start_time && entry.end_time) {
        const start = new Date(`1970-01-01T${entry.start_time}:00`);
        const end = new Date(`1970-01-01T${entry.end_time}:00`);
        duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }

      return [
        entry.date,
        `Employé ${entry.employee_id}`,
        entry.start_time || 'N/A',
        entry.end_time || 'N/A',
        duration.toFixed(1),
        entry.type,
        entry.description || ''
      ];
    });

    return [...headers, ...payrollRows];
  }

  private prepareTimeEntriesSummary(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string }
  ): any[][] {
    const totalHours = data.entries.reduce((sum, entry) => {
      if (!entry.start_time || !entry.end_time) return sum;
      const start = new Date(`1970-01-01T${entry.start_time}:00`);
      const end = new Date(`1970-01-01T${entry.end_time}:00`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return [
      ['Synthèse Générale'],
      [`Période: ${dates.start} au ${dates.end}`],
      [''],
      ['Métriques', 'Valeur'],
      ['Total Heures Travaillées', totalHours.toFixed(1)],
      ['Nombre d\'Entrées', data.entries.length]
    ];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculateDateRange(period: string, startDate?: string, endDate?: string): { start: string, end: string } {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    const now = new Date();
    let start: Date, end: Date;

    switch (period) {
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        start = new Date(now);
        end = new Date(now);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  private calculateMonthRange(month: string): { start: string, end: string } {
    const [year, monthNum] = month.split('-').map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0);
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }

  private calculateMonthlyStats(timeEntries: any[], planningEntries: any[]) {
    let totalHours = 0;
    let overtimeHours = 0;

    timeEntries.forEach(entry => {
      if (!entry.start_time || !entry.end_time) return;
      const start = new Date(`1970-01-01T${entry.start_time}:00`);
      const end = new Date(`1970-01-01T${entry.end_time}:00`);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      totalHours += duration;
      if (entry.type === 'overtime') {
        overtimeHours += duration;
      }
    });

    const workDays = new Set(timeEntries.map(e => e.date)).size;
    const projectCount = new Set(timeEntries.map(e => e.project_id).filter(Boolean)).size;

    return {
      totalHours,
      overtimeHours,
      workDays,
      projectCount,
      month: timeEntries[0]?.date?.substring(0, 7) || ''
    };
  }

  private getCompanyInfo(): CompanyInfo {
    return {
      name: 'ClockPilot Enterprise',
      address: '123 Avenue des Entrepreneurs, 75001 Paris',
      phone: '+33 1 23 45 67 89',
      email: 'contact@clockpilot.fr',
      siret: '12345678901234'
    };
  }

  // ============================================================================
  // HTML GENERATION FOR PDF
  // ============================================================================

  private generatePlanningHTML(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string }
  ): string {
    const companyInfo = this.getCompanyInfo();

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Planning Export</title>
      <style>
        ${this.getPDFStyles()}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyInfo.name}</h1>
        <h2>Planning - ${dates.start} au ${dates.end}</h2>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employé</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Type</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${data.entries.map(entry => `
          <tr>
            <td>${entry.date}</td>
            <td>Employé ${entry.employee_id}</td>
            <td>${entry.start_time || 'N/A'}</td>
            <td>${entry.end_time || 'N/A'}</td>
            <td>${entry.type}</td>
            <td>${entry.status}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;
  }

  private generateTimeEntriesHTML(
    data: { entries: any[], employees: any[], projects: any[] },
    dates: { start: string, end: string }
  ): string {
    const companyInfo = this.getCompanyInfo();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Temps</title>
      <style>
        ${this.getPDFStyles()}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyInfo.name}</h1>
        <h2>Rapport de Temps - ${dates.start} au ${dates.end}</h2>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employé</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${data.entries.map(entry => `
          <tr>
            <td>${entry.date}</td>
            <td>Employé ${entry.employee_id}</td>
            <td>${entry.start_time || 'N/A'}</td>
            <td>${entry.end_time || 'N/A'}</td>
            <td>${entry.type}</td>
            <td>${entry.description || ''}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
    `;
  }

  private generateMonthlyReportHTML(data: {
    employee: any,
    timeEntries: any[],
    planningEntries: any[],
    projects: any[],
    stats: any
  }): string {
    const companyInfo = this.getCompanyInfo();
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport Mensuel</title>
      <style>
        ${this.getPDFStyles()}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyInfo.name}</h1>
        <h2>Rapport Mensuel - ${data.employee.first_name} ${data.employee.last_name}</h2>
        <p>Période: ${data.stats.month}</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Heures Travaillées</h4>
          <span class="stat-value">${data.stats.totalHours.toFixed(1)}h</span>
        </div>
        <div class="stat-card">
          <h4>Heures Supplémentaires</h4>
          <span class="stat-value">${data.stats.overtimeHours.toFixed(1)}h</span>
        </div>
        <div class="stat-card">
          <h4>Jours Travaillés</h4>
          <span class="stat-value">${data.stats.workDays}</span>
        </div>
        <div class="stat-card">
          <h4>Projets</h4>
          <span class="stat-value">${data.stats.projectCount}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <p>Signature Employé:</p>
          <div class="signature-line"></div>
        </div>
        <div class="signature-box">
          <p>Signature Manager:</p>
          <div class="signature-line"></div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  private getPDFStyles(): string {
    return `
      body { 
        font-family: Arial, sans-serif; 
        margin: 0; 
        padding: 20px; 
        font-size: 12px;
        line-height: 1.4;
      }
      
      .header { 
        text-align: center; 
        margin-bottom: 30px; 
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
      }
      
      .header h1 { 
        color: #333; 
        margin: 0;
        font-size: 24px;
      }
      
      .header h2 { 
        color: #666; 
        margin: 10px 0 0 0;
        font-size: 18px;
      }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 20px;
      }
      
      th, td { 
        border: 1px solid #ddd; 
        padding: 8px; 
        text-align: left;
      }
      
      th { 
        background-color: #f2f2f2; 
        font-weight: bold;
      }
      
      tr:nth-child(even) { 
        background-color: #f9f9f9; 
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin: 30px 0;
      }
      
      .stat-card {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid #e9ecef;
      }
      
      .stat-card h4 {
        margin: 0 0 10px 0;
        color: #495057;
        font-size: 14px;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
      }
      
      .signature-section {
        margin-top: 60px;
        display: flex;
        justify-content: space-between;
      }
      
      .signature-box {
        width: 45%;
      }
      
      .signature-line {
        border-bottom: 1px solid #333;
        margin-top: 30px;
        height: 40px;
      }
    `;
  }

  private getPDFHeader(): string {
    return `
      <div style="font-size: 10px; padding: 10px; border-bottom: 1px solid #ddd;">
        <span>ClockPilot Enterprise</span>
        <span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;
  }

  private getPDFFooter(): string {
    return `
      <div style="font-size: 10px; padding: 10px; border-top: 1px solid #ddd; text-align: center;">
        <span>Document généré le ${new Date().toLocaleDateString('fr-FR')} - ClockPilot Enterprise</span>
      </div>
    `;
  }
}