import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Response } from 'express';
import type { ExportEmployee, ExportTimeEntry, ExportPlanningEntry, ExportOptions } from './export.service';

export class PDFService {
  async generatePDF(
    data: {
      employees: ExportEmployee[];
      timeEntries: ExportTimeEntry[];
      planningEntries: ExportPlanningEntry[];
    },
    options: ExportOptions,
    res: Response
  ): Promise<void> {
    // For now, we'll provide a simple HTML-based PDF response
    // In production, you would use a proper PDF library like Puppeteer
    
    const filename = this.generateFilename(options);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.json({
      message: 'PDF generation disponible prochainement',
      filename,
      data: {
        employees: data.employees.length,
        timeEntries: data.timeEntries.length,
        planningEntries: data.planningEntries.length,
        type: options.type,
        dateRange: options.dateRange
      }
    });
  }

  private generateFilename(options: ExportOptions): string {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const typeStr = options.type.replace('-', '_');
    return `clockpilot_${typeStr}_${dateStr}.pdf`;
  }
}

export const pdfService = new PDFService();

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  logo: {
    width: 60,
    height: 60
  },
  section: {
    marginVertical: 10
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold'
  },
  tableCol: {
    width: '12.5%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4
  },
  tableColWide: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4
  },
  tableCell: {
    fontSize: 8,
    textAlign: 'center'
  },
  summary: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    marginTop: 20
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#64748b'
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signatureBox: {
    width: '40%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 80
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10
  }
});

// Planning PDF Document
const PlanningPDF = ({ 
  data, 
  options 
}: { 
  data: { 
    employees: ExportEmployee[], 
    planningEntries: ExportPlanningEntry[] 
  }, 
  options: ExportOptions 
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Planning des Équipes</Text>
          <Text style={styles.subtitle}>
            Du {format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} au{' '}
            {format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}
          </Text>
        </View>
        <View>
          <Text style={styles.subtitle}>ClockPilot</Text>
          <Text style={styles.subtitle}>Généré le {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</Text>
        </View>
      </View>

      {/* Planning Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableColWide}>
            <Text style={styles.tableCell}>Employé</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Date</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Début</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Fin</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Type</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Durée</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Statut</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Département</Text>
          </View>
        </View>

        {/* Data Rows */}
        {data.planningEntries.slice(0, 30).map((entry, index) => {
          const employee = data.employees.find(e => e.id === entry.employeeId);
          const duration = calculateDuration(entry.startTime, entry.endTime);
          
          return (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>{entry.employeeName}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(entry.date), 'dd/MM', { locale: fr })}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(entry.startTime), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(entry.endTime), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{getTypeText(entry.type)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{duration}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{getStatusText(entry.status)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{employee?.department}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text>Nombre d'entrées:</Text>
          <Text>{data.planningEntries.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Employés concernés:</Text>
          <Text>{new Set(data.planningEntries.map(e => e.employeeId)).size}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Statut validé:</Text>
          <Text>{data.planningEntries.filter(e => e.status === 'validated').length}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>ClockPilot - Gestion du temps de travail</Text>
        <Text>Page 1 sur 1</Text>
      </View>
    </Page>
  </Document>
);

// Timesheet PDF Document
const TimesheetPDF = ({ 
  data, 
  options 
}: { 
  data: { 
    employees: ExportEmployee[], 
    timeEntries: ExportTimeEntry[] 
  }, 
  options: ExportOptions 
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feuille de Temps</Text>
          <Text style={styles.subtitle}>
            Du {format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} au{' '}
            {format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}
          </Text>
        </View>
        <View>
          <Text style={styles.subtitle}>ClockPilot</Text>
          <Text style={styles.subtitle}>Généré le {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</Text>
        </View>
      </View>

      {/* Timesheet Table */}
      <View style={styles.table}>
        {/* Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableColWide}>
            <Text style={styles.tableCell}>Employé</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Date</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Entrée</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Sortie</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Type</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Durée</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Statut</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Département</Text>
          </View>
        </View>

        {/* Data Rows */}
        {data.timeEntries.slice(0, 25).map((entry, index) => {
          const employee = data.employees.find(e => e.id === entry.employeeId);
          
          return (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>{entry.employeeName}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {format(new Date(entry.date), 'dd/MM', { locale: fr })}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {entry.clockIn ? format(new Date(entry.clockIn), 'HH:mm') : '-'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : 'En cours'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{getTypeText(entry.type)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatDuration(entry.duration)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {entry.clockOut ? 'Terminé' : 'En cours'}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{employee?.department}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text>Total heures travaillées:</Text>
          <Text>{formatDuration(data.timeEntries.reduce((sum, entry) => sum + entry.duration, 0))}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Nombre d'entrées:</Text>
          <Text>{data.timeEntries.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Employés actifs:</Text>
          <Text>{new Set(data.timeEntries.map(e => e.employeeId)).size}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>ClockPilot - Gestion du temps de travail</Text>
        <Text>Page 1 sur 1</Text>
      </View>
    </Page>
  </Document>
);

// Attendance Certificate PDF
const AttendanceCertificatePDF = ({ 
  data, 
  options 
}: { 
  data: { 
    employees: ExportEmployee[], 
    timeEntries: ExportTimeEntry[] 
  }, 
  options: ExportOptions 
}) => (
  <Document>
    {data.employees.map((employee, employeeIndex) => {
      const employeeTimeEntries = data.timeEntries.filter(entry => entry.employeeId === employee.id);
      const totalHours = employeeTimeEntries.reduce((sum, entry) => sum + entry.duration, 0);
      
      return (
        <Page key={employeeIndex} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>ATTESTATION DE PRÉSENCE</Text>
              <Text style={styles.subtitle}>Document officiel</Text>
            </View>
            <View>
              <Text style={styles.subtitle}>ClockPilot SAS</Text>
              <Text style={styles.subtitle}>123 Rue de la Technologie</Text>
              <Text style={styles.subtitle}>75001 Paris</Text>
            </View>
          </View>

          {/* Certificate Content */}
          <View style={{ marginTop: 40 }}>
            <Text style={{ fontSize: 12, marginBottom: 20 }}>
              Je soussigné(e), certifie que :
            </Text>
            
            <View style={{ marginBottom: 30, padding: 15, backgroundColor: '#f8fafc' }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text style={{ fontSize: 11, marginBottom: 5 }}>
                Poste: {employee.position}
              </Text>
              <Text style={{ fontSize: 11, marginBottom: 5 }}>
                Département: {employee.department}
              </Text>
              <Text style={{ fontSize: 11 }}>
                Email: {employee.email}
              </Text>
            </View>

            <Text style={{ fontSize: 12, marginBottom: 20 }}>
              A bien été présent(e) du {format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr })} au{' '}
              {format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr })}
            </Text>

            <View style={{ marginBottom: 30, padding: 15, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>
                Détail des heures travaillées:
              </Text>
              <Text style={{ fontSize: 11, marginBottom: 5 }}>
                Nombre total d'heures: {formatDuration(totalHours)}
              </Text>
              <Text style={{ fontSize: 11, marginBottom: 5 }}>
                Type de contrat: {employee.contractType}
              </Text>
              <Text style={{ fontSize: 11 }}>
                Heures hebdomadaires contractuelles: {employee.weeklyHours}h
              </Text>
            </View>

            <Text style={{ fontSize: 11, marginBottom: 40 }}>
              Fait à Paris, le {format(new Date(), 'dd/MM/yyyy', { locale: fr })}
            </Text>
          </View>

          {/* Signature Section */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature de l'employeur</Text>
              <Text style={{ fontSize: 8, marginTop: 20, color: '#64748b' }}>
                Signature électronique
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Signature de l'employé(e)</Text>
              <Text style={{ fontSize: 8, marginTop: 20, color: '#64748b' }}>
                Signature électronique
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>ClockPilot - Attestation de présence</Text>
            <Text>Document {employeeIndex + 1} sur {data.employees.length}</Text>
          </View>
        </Page>
      );
    })}
  </Document>
);

// Helper functions
function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

function getStatusText(status: string): string {
  const statusMap = {
    'planned': 'Planifié',
    'validated': 'Validé',
    'rejected': 'Rejeté'
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

function getTypeText(type: string): string {
  const typeMap = {
    'work': 'Travail',
    'break': 'Pause',
    'vacation': 'Congé',
    'sick': 'Maladie'
  };
  return typeMap[type as keyof typeof typeMap] || type;
}

export class PDFService {
  async generatePDF(
    data: {
      employees: ExportEmployee[];
      timeEntries: ExportTimeEntry[];
      planningEntries: ExportPlanningEntry[];
    },
    options: ExportOptions,
    res: Response
  ): Promise<void> {
    let document: any;

    switch (options.type) {
      case 'planning':
        document = <PlanningPDF data={data} options={options} />;
        break;
      case 'timesheet':
        document = <TimesheetPDF data={data} options={options} />;
        break;
      case 'attendance-certificate':
        document = <AttendanceCertificatePDF data={data} options={options} />;
        break;
      case 'monthly-report':
        // Use planning template for monthly report
        document = <PlanningPDF data={data} options={options} />;
        break;
      default:
        throw new Error(`Type de PDF non supporté: ${options.type}`);
    }

    const filename = this.generateFilename(options);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Generate and stream PDF
    const pdfBuffer = await pdf(document).toBuffer();
    res.send(pdfBuffer);
  }

  private generateFilename(options: ExportOptions): string {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const typeStr = options.type.replace('-', '_');
    return `clockpilot_${typeStr}_${dateStr}.pdf`;
  }
}

export const pdfService = new PDFService();