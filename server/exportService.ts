import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExportOptions {
  format: 'excel' | 'pdf';
  dateRange?: {
    start: string;
    end: string;
  };
  employeeIds?: string[];
}

export class ExportService {
  
  // Export planning data
  async exportPlanning(data: any[], options: ExportOptions): Promise<Buffer> {
    if (options.format === 'excel') {
      return this.exportPlanningToExcel(data);
    } else {
      return this.exportPlanningToPDF(data);
    }
  }

  // Export time entries data
  async exportTimeEntries(data: any[], options: ExportOptions): Promise<Buffer> {
    if (options.format === 'excel') {
      return this.exportTimeEntriesToExcel(data);
    } else {
      return this.exportTimeEntriesToPDF(data);
    }
  }

  // Export reports data
  async exportReports(data: any[], options: ExportOptions): Promise<Buffer> {
    if (options.format === 'excel') {
      return this.exportReportsToExcel(data);
    } else {
      return this.exportReportsToPDF(data);
    }
  }

  private async exportPlanningToExcel(data: any[]): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Group data by employee
    const groupedData = data.reduce((acc, entry) => {
      const employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`;
      if (!acc[employeeName]) {
        acc[employeeName] = [];
      }
      acc[employeeName].push(entry);
      return acc;
    }, {});

    // Create a sheet for each employee
    Object.entries(groupedData).forEach(([employeeName, entries]: [string, any]) => {
      const sheetData = [
        // Headers
        ['Date', 'Heure début', 'Heure fin', 'Projet', 'Tâche', 'Statut', 'Heures planifiées'],
        // Data rows
        ...entries.map((entry: any) => [
          format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }),
          entry.startTime,
          entry.endTime,
          entry.project?.name || 'N/A',
          entry.task?.title || entry.description || 'N/A',
          entry.status,
          entry.plannedHours
        ])
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { width: 12 }, // Date
        { width: 12 }, // Heure début
        { width: 12 }, // Heure fin
        { width: 20 }, // Projet
        { width: 30 }, // Tâche
        { width: 15 }, // Statut
        { width: 15 }  // Heures planifiées
      ];

      // Add conditional formatting for status
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = 1; row <= range.e.r; row++) {
        const statusCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 5 })];
        if (statusCell && statusCell.v) {
          switch (statusCell.v) {
            case 'validated':
              statusCell.s = { fill: { fgColor: { rgb: 'D4E6F1' } } };
              break;
            case 'pending':
              statusCell.s = { fill: { fgColor: { rgb: 'FCF3CF' } } };
              break;
            case 'draft':
              statusCell.s = { fill: { fgColor: { rgb: 'FADBD8' } } };
              break;
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, employeeName.slice(0, 31));
    });

    // Add summary sheet
    const summaryData = [
      ['Résumé du planning'],
      [''],
      ['Employé', 'Heures planifiées', 'Nombre d\'entrées'],
      ...Object.entries(groupedData).map(([employeeName, entries]: [string, any]) => [
        employeeName,
        entries.reduce((sum: number, entry: any) => sum + (entry.plannedHours || 0), 0),
        entries.length
      ])
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ width: 25 }, { width: 18 }, { width: 18 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private async exportTimeEntriesToExcel(data: any[]): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    const sheetData = [
      // Headers with company info
      ['ClockPilot - Export des saisies de temps'],
      [`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`],
      [''],
      ['Date', 'Employé', 'Heure début', 'Heure fin', 'Pause (min)', 'Heures travaillées', 'Heures sup.', 'Projet', 'Tâche', 'Statut'],
      // Data rows
      ...data.map((entry: any) => [
        format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr }),
        `${entry.employee.firstName} ${entry.employee.lastName}`,
        entry.startTime,
        entry.endTime,
        entry.breakDuration || 0,
        entry.workedHours,
        entry.overtimeHours || 0,
        entry.project?.name || 'N/A',
        entry.task?.title || entry.description || 'N/A',
        entry.status
      ])
    ];

    // Add totals row
    const totalWorkedHours = data.reduce((sum, entry) => sum + (entry.workedHours || 0), 0);
    const totalOvertimeHours = data.reduce((sum, entry) => sum + (entry.overtimeHours || 0), 0);
    
    sheetData.push(
      [''],
      ['TOTAUX', '', '', '', '', totalWorkedHours, totalOvertimeHours, '', '', '']
    );

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 20 }, // Employé
      { width: 12 }, // Heure début
      { width: 12 }, // Heure fin
      { width: 12 }, // Pause
      { width: 15 }, // Heures travaillées
      { width: 12 }, // Heures sup.
      { width: 20 }, // Projet
      { width: 30 }, // Tâche
      { width: 15 }  // Statut
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Saisies de temps');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private async exportReportsToExcel(data: any[]): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Monthly report by employee
    const monthlyData = [
      ['Rapport mensuel - Employés'],
      [`Période: ${format(new Date(), 'MMMM yyyy', { locale: fr })}`],
      [''],
      ['Employé', 'Heures planifiées', 'Heures réalisées', 'Heures sup.', 'Taux de réalisation', 'Jours travaillés'],
      ...data.map((employee: any) => [
        `${employee.firstName} ${employee.lastName}`,
        employee.plannedHours || 0,
        employee.workedHours || 0,
        employee.overtimeHours || 0,
        employee.workedHours > 0 ? `${Math.round((employee.workedHours / employee.plannedHours) * 100)}%` : '0%',
        employee.workingDays || 0
      ])
    ];

    const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
    monthlySheet['!cols'] = [
      { width: 25 }, // Employé
      { width: 18 }, // Heures planifiées
      { width: 18 }, // Heures réalisées
      { width: 15 }, // Heures sup.
      { width: 18 }, // Taux de réalisation
      { width: 15 }  // Jours travaillés
    ];

    XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Rapport mensuel');

    // Payroll summary sheet
    const payrollData = [
      ['Synthèse pour la paie'],
      [`Période: ${format(new Date(), 'MMMM yyyy', { locale: fr })}`],
      [''],
      ['N° employé', 'Nom', 'Prénom', 'Heures normales', 'Heures sup. 25%', 'Heures sup. 50%', 'Jours congés', 'Jours maladie'],
      ...data.map((employee: any) => [
        employee.employeeNumber || employee.id,
        employee.lastName,
        employee.firstName,
        employee.regularHours || 0,
        employee.overtime25 || 0,
        employee.overtime50 || 0,
        employee.vacationDays || 0,
        employee.sickDays || 0
      ])
    ];

    const payrollSheet = XLSX.utils.aoa_to_sheet(payrollData);
    payrollSheet['!cols'] = [
      { width: 15 }, // N° employé
      { width: 20 }, // Nom
      { width: 20 }, // Prénom
      { width: 15 }, // Heures normales
      { width: 15 }, // Heures sup. 25%
      { width: 15 }, // Heures sup. 50%
      { width: 15 }, // Jours congés
      { width: 15 }  // Jours maladie
    ];

    XLSX.utils.book_append_sheet(workbook, payrollSheet, 'Synthèse paie');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }

  private async exportPlanningToPDF(data: any[]): Promise<Buffer> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      const html = this.generatePlanningHTML(data);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private async exportTimeEntriesToPDF(data: any[]): Promise<Buffer> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      const html = this.generateTimeEntriesHTML(data);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private async exportReportsToPDF(data: any[]): Promise<Buffer> {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      const html = this.generateReportsHTML(data);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generatePlanningHTML(data: any[]): string {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Planning - ClockPilot</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .report-title { font-size: 18px; margin: 10px 0; }
        .report-date { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .status-validated { background-color: #d4f4dd; }
        .status-pending { background-color: #fff3cd; }
        .status-draft { background-color: #f8d7da; }
        .footer { margin-top: 50px; font-size: 10px; color: #666; }
        .signature { margin-top: 50px; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">ClockPilot</div>
        <div class="report-title">Planning des équipes</div>
        <div class="report-date">Généré le ${currentDate}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employé</th>
            <th>Heure début</th>
            <th>Heure fin</th>
            <th>Projet</th>
            <th>Tâche</th>
            <th>Statut</th>
            <th>Heures</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(entry => `
            <tr class="status-${entry.status}">
              <td>${format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td>${entry.employee.firstName} ${entry.employee.lastName}</td>
              <td>${entry.startTime}</td>
              <td>${entry.endTime}</td>
              <td>${entry.project?.name || 'N/A'}</td>
              <td>${entry.task?.title || entry.description || 'N/A'}</td>
              <td>${entry.status}</td>
              <td>${entry.plannedHours}h</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="signature">
        <p>Responsable planning :</p>
        <div class="signature-line"></div>
        <p>Date et signature</p>
      </div>

      <div class="footer">
        <p>Document généré automatiquement par ClockPilot - ${currentDate}</p>
        <p>Ce document contient des informations confidentielles. Toute reproduction ou diffusion est interdite sans autorisation.</p>
      </div>
    </body>
    </html>`;
  }

  private generateTimeEntriesHTML(data: any[]): string {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    const totalHours = data.reduce((sum, entry) => sum + (entry.workedHours || 0), 0);
    const totalOvertime = data.reduce((sum, entry) => sum + (entry.overtimeHours || 0), 0);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Saisie des temps - ClockPilot</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .report-title { font-size: 18px; margin: 10px 0; }
        .report-date { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .totals { background-color: #e3f2fd; font-weight: bold; }
        .footer { margin-top: 50px; font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">ClockPilot</div>
        <div class="report-title">Relevé des temps de travail</div>
        <div class="report-date">Généré le ${currentDate}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employé</th>
            <th>Début</th>
            <th>Fin</th>
            <th>Pause (min)</th>
            <th>H. travaillées</th>
            <th>H. sup.</th>
            <th>Projet</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(entry => `
            <tr>
              <td>${format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}</td>
              <td>${entry.employee.firstName} ${entry.employee.lastName}</td>
              <td>${entry.startTime}</td>
              <td>${entry.endTime}</td>
              <td>${entry.breakDuration || 0}</td>
              <td>${entry.workedHours}h</td>
              <td>${entry.overtimeHours || 0}h</td>
              <td>${entry.project?.name || 'N/A'}</td>
              <td>${entry.status}</td>
            </tr>
          `).join('')}
          <tr class="totals">
            <td colspan="5">TOTAUX</td>
            <td>${totalHours}h</td>
            <td>${totalOvertime}h</td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Document généré automatiquement par ClockPilot - ${currentDate}</p>
        <p>Conformément au Code du travail français - Art. L3171-3</p>
      </div>
    </body>
    </html>`;
  }

  private generateReportsHTML(data: any[]): string {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });
    const currentMonth = format(new Date(), 'MMMM yyyy', { locale: fr });
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport mensuel - ClockPilot</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; color: #2563eb; }
        .report-title { font-size: 18px; margin: 10px 0; }
        .report-date { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .section-title { font-size: 16px; font-weight: bold; margin: 30px 0 10px 0; }
        .footer { margin-top: 50px; font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">ClockPilot</div>
        <div class="report-title">Rapport mensuel des activités</div>
        <div class="report-date">Période : ${currentMonth}</div>
      </div>

      <div class="section-title">Synthèse par employé</div>
      <table>
        <thead>
          <tr>
            <th>Employé</th>
            <th>H. planifiées</th>
            <th>H. réalisées</th>
            <th>H. supplémentaires</th>
            <th>Taux de réalisation</th>
            <th>Jours travaillés</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(employee => `
            <tr>
              <td>${employee.firstName} ${employee.lastName}</td>
              <td>${employee.plannedHours || 0}h</td>
              <td>${employee.workedHours || 0}h</td>
              <td>${employee.overtimeHours || 0}h</td>
              <td>${employee.workedHours > 0 ? Math.round((employee.workedHours / employee.plannedHours) * 100) : 0}%</td>
              <td>${employee.workingDays || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Données pour la paie</div>
      <table>
        <thead>
          <tr>
            <th>N° employé</th>
            <th>Nom</th>
            <th>Prénom</th>
            <th>H. normales</th>
            <th>H. sup. 25%</th>
            <th>H. sup. 50%</th>
            <th>Congés</th>
            <th>Maladie</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(employee => `
            <tr>
              <td>${employee.employeeNumber || employee.id}</td>
              <td>${employee.lastName}</td>
              <td>${employee.firstName}</td>
              <td>${employee.regularHours || 0}h</td>
              <td>${employee.overtime25 || 0}h</td>
              <td>${employee.overtime50 || 0}h</td>
              <td>${employee.vacationDays || 0}</td>
              <td>${employee.sickDays || 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Document généré automatiquement par ClockPilot - ${currentDate}</p>
        <p>Données conformes aux obligations légales de suivi du temps de travail</p>
      </div>
    </body>
    </html>`;
  }
}