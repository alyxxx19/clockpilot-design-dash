import { sql } from 'drizzle-orm';
import { db } from './db';
import { employees, planningEntries, timeEntries, validations } from '@shared/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// Types pour la logique métier
export interface LegalConstraints {
  maxDailyHours: number;
  maxWeeklyHours: number;
  minRestHours: number;
  averageWeeklyHours: number;
  averageWeeksPeriod: number;
}

export interface PlanningConflict {
  type: 'max_daily_hours' | 'max_weekly_hours' | 'min_rest_period' | 'overlap' | 'average_hours';
  severity: 'error' | 'warning';
  employeeId: number;
  date: string;
  description: string;
  suggestions: string[];
  data?: any;
}

export interface WeeklyHours {
  employeeId: number;
  weekStart: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
  validationStatus: string;
}

export interface ScheduleConflict {
  employeeId: number;
  date: string;
  conflictingEntries: Array<{
    id: number;
    startTime: string;
    endTime: string;
  }>;
  type: 'overlap' | 'insufficient_rest';
}

// Contraintes légales françaises
export const LEGAL_CONSTRAINTS: LegalConstraints = {
  maxDailyHours: 10,
  maxWeeklyHours: 48,
  minRestHours: 11,
  averageWeeklyHours: 35,
  averageWeeksPeriod: 12,
};

// ============================================================================
// VÉRIFICATION DES CONTRAINTES LÉGALES
// ============================================================================

export async function checkLegalConstraints(
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: number
): Promise<{ valid: boolean; conflicts: PlanningConflict[] }> {
  const conflicts: PlanningConflict[] = [];

  // Vérifier les heures quotidiennes
  const dailyCheck = await checkDailyHours(employeeId, date, startTime, endTime, excludeEntryId);
  if (!dailyCheck.valid) {
    conflicts.push(...dailyCheck.conflicts);
  }

  // Vérifier les heures hebdomadaires
  const weeklyCheck = await checkWeeklyHours(employeeId, date, startTime, endTime, excludeEntryId);
  if (!weeklyCheck.valid) {
    conflicts.push(...weeklyCheck.conflicts);
  }

  // Vérifier la période de repos
  const restCheck = await checkRestPeriod(employeeId, date, startTime, excludeEntryId);
  if (!restCheck.valid) {
    conflicts.push(...restCheck.conflicts);
  }

  return {
    valid: conflicts.length === 0,
    conflicts
  };
}

async function checkDailyHours(
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: number
): Promise<{ valid: boolean; conflicts: PlanningConflict[] }> {
  const conflicts: PlanningConflict[] = [];

  // Calculer les heures de cette entrée
  const entryHours = calculateHoursBetween(startTime, endTime);

  // Récupérer toutes les entrées du jour
  let query = db
    .select({
      id: planningEntries.id,
      startTime: planningEntries.start_time,
      endTime: planningEntries.end_time,
    })
    .from(planningEntries)
    .where(
      and(
        eq(planningEntries.employee_id, employeeId),
        eq(planningEntries.date, date),
        eq(planningEntries.type, 'work')
      )
    );

  const existingEntries = await query;

  // Exclure l'entrée en cours de modification
  const filteredEntries = excludeEntryId 
    ? existingEntries.filter(e => e.id !== excludeEntryId)
    : existingEntries;

  // Calculer le total des heures quotidiennes
  let totalDailyHours = entryHours;
  filteredEntries.forEach(entry => {
    if (entry.startTime && entry.endTime) {
      totalDailyHours += calculateHoursBetween(entry.startTime, entry.endTime);
    }
  });

  if (totalDailyHours > LEGAL_CONSTRAINTS.maxDailyHours) {
    conflicts.push({
      type: 'max_daily_hours',
      severity: 'error',
      employeeId,
      date,
      description: `Dépassement de la limite quotidienne de ${LEGAL_CONSTRAINTS.maxDailyHours}h (${totalDailyHours.toFixed(1)}h prévues)`,
      suggestions: [
        'Réduire la durée de cette plage horaire',
        'Diviser le travail sur plusieurs jours',
        'Supprimer d\'autres créneaux du jour'
      ],
      data: { totalHours: totalDailyHours, limit: LEGAL_CONSTRAINTS.maxDailyHours }
    });
  }

  return { valid: conflicts.length === 0, conflicts };
}

async function checkWeeklyHours(
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: number
): Promise<{ valid: boolean; conflicts: PlanningConflict[] }> {
  const conflicts: PlanningConflict[] = [];

  // Calculer le début et fin de semaine
  const { weekStart, weekEnd } = getWeekBounds(date);

  // Calculer les heures de cette entrée
  const entryHours = calculateHoursBetween(startTime, endTime);

  // Récupérer toutes les entrées de la semaine
  let query = db
    .select({
      id: planningEntries.id,
      startTime: planningEntries.start_time,
      endTime: planningEntries.end_time,
      date: planningEntries.date,
    })
    .from(planningEntries)
    .where(
      and(
        eq(planningEntries.employee_id, employeeId),
        gte(planningEntries.date, weekStart),
        lte(planningEntries.date, weekEnd),
        eq(planningEntries.type, 'work')
      )
    );

  const weeklyEntries = await query;

  // Exclure l'entrée en cours de modification
  const filteredEntries = excludeEntryId 
    ? weeklyEntries.filter(e => e.id !== excludeEntryId)
    : weeklyEntries;

  // Calculer le total des heures hebdomadaires
  let totalWeeklyHours = 0;
  filteredEntries.forEach(entry => {
    if (entry.startTime && entry.endTime) {
      totalWeeklyHours += calculateHoursBetween(entry.startTime, entry.endTime);
    }
  });

  // Ajouter les heures de cette entrée si elle est dans la même semaine
  if (date >= weekStart && date <= weekEnd) {
    totalWeeklyHours += entryHours;
  }

  if (totalWeeklyHours > LEGAL_CONSTRAINTS.maxWeeklyHours) {
    conflicts.push({
      type: 'max_weekly_hours',
      severity: 'error',
      employeeId,
      date: weekStart,
      description: `Dépassement de la limite hebdomadaire de ${LEGAL_CONSTRAINTS.maxWeeklyHours}h (${totalWeeklyHours.toFixed(1)}h prévues)`,
      suggestions: [
        'Réduire les heures quotidiennes',
        'Ajouter des jours de repos',
        'Reporter du travail sur la semaine suivante'
      ],
      data: { totalHours: totalWeeklyHours, limit: LEGAL_CONSTRAINTS.maxWeeklyHours, weekStart }
    });
  }

  return { valid: conflicts.length === 0, conflicts };
}

async function checkRestPeriod(
  employeeId: number,
  date: string,
  startTime: string,
  excludeEntryId?: number
): Promise<{ valid: boolean; conflicts: PlanningConflict[] }> {
  const conflicts: PlanningConflict[] = [];

  // Récupérer la dernière entrée du jour précédent
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  const previousDateStr = previousDay.toISOString().split('T')[0];

  let query = db
    .select({
      id: planningEntries.id,
      endTime: planningEntries.end_time,
    })
    .from(planningEntries)
    .where(
      and(
        eq(planningEntries.employee_id, employeeId),
        eq(planningEntries.date, previousDateStr),
        eq(planningEntries.type, 'work')
      )
    )
    .orderBy(desc(planningEntries.end_time))
    .limit(1);

  const [lastEntry] = await query;

  if (lastEntry && lastEntry.endTime) {
    // Calculer la période de repos
    const lastEndTime = new Date(`${previousDateStr}T${lastEntry.endTime}:00`);
    const nextStartTime = new Date(`${date}T${startTime}:00`);
    
    const restHours = (nextStartTime.getTime() - lastEndTime.getTime()) / (1000 * 60 * 60);

    if (restHours < LEGAL_CONSTRAINTS.minRestHours) {
      conflicts.push({
        type: 'min_rest_period',
        severity: 'error',
        employeeId,
        date,
        description: `Période de repos insuffisante: ${restHours.toFixed(1)}h (minimum: ${LEGAL_CONSTRAINTS.minRestHours}h)`,
        suggestions: [
          'Décaler l\'heure de début',
          'Terminer plus tôt le jour précédent',
          'Ajouter un jour de repos'
        ],
        data: { restHours, minRestHours: LEGAL_CONSTRAINTS.minRestHours, previousEndTime: lastEntry.endTime }
      });
    }
  }

  return { valid: conflicts.length === 0, conflicts };
}

// ============================================================================
// CALCUL DES HEURES HEBDOMADAIRES
// ============================================================================

export async function calculateWeeklyHours(
  employeeId: number,
  weekStart: string
): Promise<WeeklyHours> {
  const { weekEnd } = getWeekBounds(weekStart);

  // Heures planifiées
  const plannedEntries = await db
    .select({
      startTime: planningEntries.start_time,
      endTime: planningEntries.end_time,
    })
    .from(planningEntries)
    .where(
      and(
        eq(planningEntries.employee_id, employeeId),
        gte(planningEntries.date, weekStart),
        lte(planningEntries.date, weekEnd),
        eq(planningEntries.type, 'work')
      )
    );

  let plannedHours = 0;
  plannedEntries.forEach(entry => {
    if (entry.startTime && entry.endTime) {
      plannedHours += calculateHoursBetween(entry.startTime, entry.endTime);
    }
  });

  // Heures réalisées
  const actualEntries = await db
    .select({
      startTime: timeEntries.start_time,
      endTime: timeEntries.end_time,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.employee_id, employeeId),
        gte(timeEntries.date, weekStart),
        lte(timeEntries.date, weekEnd),
        eq(timeEntries.type, 'work'),
        eq(timeEntries.status, 'validated')
      )
    );

  let actualHours = 0;
  actualEntries.forEach(entry => {
    if (entry.startTime && entry.endTime) {
      actualHours += calculateHoursBetween(entry.startTime, entry.endTime);
    }
  });

  // Statut de validation
  const [validation] = await db
    .select()
    .from(validations)
    .where(
      and(
        eq(validations.employee_id, employeeId),
        eq(validations.week_start_date, weekStart)
      )
    );

  return {
    employeeId,
    weekStart,
    plannedHours: Math.round(plannedHours * 100) / 100,
    actualHours: Math.round(actualHours * 100) / 100,
    variance: Math.round((actualHours - plannedHours) * 100) / 100,
    validationStatus: validation?.status || 'pending'
  };
}

// ============================================================================
// DÉTECTION DES CONFLITS D'HORAIRES
// ============================================================================

// ============================================================================
// TIME ENTRIES BUSINESS LOGIC
// ============================================================================

export interface TimeAnomaly {
  type: 'excessive_hours' | 'missing_break' | 'overlap' | 'unauthorized_overtime' | 'planning_mismatch';
  severity: 'warning' | 'error';
  employeeId: number;
  date: string;
  description: string;
  suggestion: string;
  data?: any;
}

export interface OvertimeCalculation {
  employeeId: number;
  period: string;
  regularHours: number;
  overtimeHours: number;
  overtimeType: 'daily' | 'weekly' | 'monthly';
  rate: number;
  approved: boolean;
}

export async function calculateOvertime(
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<OvertimeCalculation[]> {
  const { storage } = await import('./storage');
  
  const entries = await storage.getTimeEntries({
    employeeId,
    dateFrom: startDate,
    dateTo: endDate,
    limit: 1000,
    offset: 0
  });

  const calculations: OvertimeCalculation[] = [];
  const dailyOvertimes: Record<string, number> = {};
  
  // Calculate daily overtime (over 8 hours)
  entries.data.forEach(entry => {
    const date = entry.date;
    const totalHours = entry.totalHours || 0;
    const dailyOvertime = Math.max(0, totalHours - 8);
    
    if (!dailyOvertimes[date]) dailyOvertimes[date] = 0;
    dailyOvertimes[date] += dailyOvertime;
    
    if (dailyOvertime > 0) {
      calculations.push({
        employeeId,
        period: date,
        regularHours: Math.min(8, totalHours),
        overtimeHours: dailyOvertime,
        overtimeType: 'daily',
        rate: 1.25, // 25% premium for daily overtime
        approved: entry.isOvertime || false
      });
    }
  });

  // Calculate weekly overtime (over 35 hours average)
  const weeklyHours: Record<string, number> = {};
  entries.data.forEach(entry => {
    const date = new Date(entry.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyHours[weekKey]) weeklyHours[weekKey] = 0;
    weeklyHours[weekKey] += entry.totalHours || 0;
  });

  Object.entries(weeklyHours).forEach(([weekStart, totalHours]) => {
    const weeklyOvertime = Math.max(0, totalHours - 35);
    if (weeklyOvertime > 0) {
      calculations.push({
        employeeId,
        period: weekStart,
        regularHours: Math.min(35, totalHours),
        overtimeHours: weeklyOvertime,
        overtimeType: 'weekly',
        rate: 1.10, // 10% premium for weekly overtime
        approved: false // Weekly overtime needs approval
      });
    }
  });

  return calculations;
}

export async function detectAnomalies(
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<TimeAnomaly[]> {
  const { storage } = await import('./storage');
  
  const entries = await storage.getTimeEntries({
    employeeId,
    dateFrom: startDate,
    dateTo: endDate,
    limit: 1000,
    offset: 0
  });

  const anomalies: TimeAnomaly[] = [];

  // Group by date
  const dailyEntries: Record<string, any[]> = {};
  entries.data.forEach(entry => {
    if (!dailyEntries[entry.date]) dailyEntries[entry.date] = [];
    dailyEntries[entry.date].push(entry);
  });

  // Detect various anomalies
  for (const [date, dayEntries] of Object.entries(dailyEntries)) {
    const totalDailyHours = dayEntries.reduce((sum, entry) => sum + (entry.totalHours || 0), 0);
    
    // Excessive daily hours (over 10h according to French law)
    if (totalDailyHours > 10) {
      anomalies.push({
        type: 'excessive_hours',
        severity: 'error',
        employeeId,
        date,
        description: `Dépassement de 10h journalières: ${totalDailyHours.toFixed(2)}h`,
        suggestion: 'Réduire les heures ou obtenir une autorisation exceptionnelle',
        data: { actualHours: totalDailyHours, limit: 10 }
      });
    }

    // Missing breaks for long work periods
    for (const entry of dayEntries) {
      const workHours = entry.totalHours || 0;
      const breakMinutes = entry.breakDuration || 0;
      
      if (workHours > 6 && breakMinutes < 20) {
        anomalies.push({
          type: 'missing_break',
          severity: 'warning',
          employeeId,
          date,
          description: `Pause insuffisante pour ${workHours.toFixed(2)}h de travail (${breakMinutes}min)`,
          suggestion: 'Ajouter au moins 20 minutes de pause pour les journées de plus de 6h',
          data: { workHours, breakMinutes, requiredBreak: 20 }
        });
      }
    }

    // Overlapping time entries
    for (let i = 0; i < dayEntries.length - 1; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const entry1 = dayEntries[i];
        const entry2 = dayEntries[j];
        
        const start1 = new Date(`1970-01-01T${entry1.startTime}:00`);
        const end1 = new Date(`1970-01-01T${entry1.endTime}:00`);
        const start2 = new Date(`1970-01-01T${entry2.startTime}:00`);
        const end2 = new Date(`1970-01-01T${entry2.endTime}:00`);

        if (start1 < end2 && end1 > start2) {
          anomalies.push({
            type: 'overlap',
            severity: 'error',
            employeeId,
            date,
            description: `Chevauchement entre ${entry1.startTime}-${entry1.endTime} et ${entry2.startTime}-${entry2.endTime}`,
            suggestion: 'Ajuster les horaires pour éviter les chevauchements',
            data: { entry1: entry1.id, entry2: entry2.id }
          });
        }
      }
    }

    // Unauthorized overtime
    const overtimeEntries = dayEntries.filter(entry => (entry.overtimeHours || 0) > 0);
    for (const entry of overtimeEntries) {
      if (!entry.isOvertime || !entry.overtimeReason) {
        anomalies.push({
          type: 'unauthorized_overtime',
          severity: 'warning',
          employeeId,
          date,
          description: `Heures supplémentaires non autorisées: ${entry.overtimeHours}h`,
          suggestion: 'Justifier les heures supplémentaires ou obtenir une autorisation',
          data: { entryId: entry.id, overtimeHours: entry.overtimeHours }
        });
      }
    }
  }

  return anomalies;
}

export async function compareWithPlanning(
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<{
  employeeId: number;
  period: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
  variancePercent: number;
  suggestions: string[];
  details: Array<{
    date: string;
    plannedHours: number;
    actualHours: number;
    variance: number;
    status: 'match' | 'under' | 'over';
  }>;
}> {
  const { storage } = await import('./storage');
  
  // Get planning entries
  const planningEntries = await storage.getPlanningEntries({
    employeeId,
    startDate,
    endDate,
    limit: 1000,
    offset: 0
  });

  // Get time entries
  const timeEntries = await storage.getTimeEntries({
    employeeId,
    dateFrom: startDate,
    dateTo: endDate,
    limit: 1000,
    offset: 0
  });

  // Group by date
  const planningByDate: Record<string, number> = {};
  const actualByDate: Record<string, number> = {};

  planningEntries.forEach(entry => {
    if (entry.startTime && entry.endTime && entry.type === 'work') {
      const start = new Date(`1970-01-01T${entry.startTime}:00`);
      const end = new Date(`1970-01-01T${entry.endTime}:00`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      planningByDate[entry.date] = (planningByDate[entry.date] || 0) + hours;
    }
  });

  timeEntries.data.forEach(entry => {
    actualByDate[entry.date] = (actualByDate[entry.date] || 0) + (entry.totalHours || 0);
  });

  // Calculate totals and variances
  const totalPlanned = Object.values(planningByDate).reduce((sum, hours) => sum + hours, 0);
  const totalActual = Object.values(actualByDate).reduce((sum, hours) => sum + hours, 0);
  const totalVariance = totalActual - totalPlanned;
  const variancePercent = totalPlanned > 0 ? (totalVariance / totalPlanned) * 100 : 0;

  // Generate daily details
  const allDates = new Set([...Object.keys(planningByDate), ...Object.keys(actualByDate)]);
  const details = Array.from(allDates).map(date => {
    const planned = planningByDate[date] || 0;
    const actual = actualByDate[date] || 0;
    const variance = actual - planned;
    
    let status: 'match' | 'under' | 'over' = 'match';
    if (Math.abs(variance) > 0.5) { // 30 minutes tolerance
      status = variance > 0 ? 'over' : 'under';
    }

    return { date, plannedHours: planned, actualHours: actual, variance, status };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Generate suggestions
  const suggestions: string[] = [];
  
  if (Math.abs(variancePercent) > 10) {
    if (variancePercent > 10) {
      suggestions.push('Temps réalisé supérieur au planning (+' + variancePercent.toFixed(1) + '%)');
      suggestions.push('Vérifier si des heures supplémentaires étaient justifiées');
    } else {
      suggestions.push('Temps réalisé inférieur au planning (' + variancePercent.toFixed(1) + '%)');
      suggestions.push('Vérifier les absences ou temps non travaillé');
    }
  }

  const overDays = details.filter(d => d.status === 'over').length;
  const underDays = details.filter(d => d.status === 'under').length;

  if (overDays > 0) {
    suggestions.push(`${overDays} jour(s) avec dépassement d'horaires`);
  }
  if (underDays > 0) {
    suggestions.push(`${underDays} jour(s) avec horaires insuffisants`);
  }

  return {
    employeeId,
    period: `${startDate} to ${endDate}`,
    plannedHours: totalPlanned,
    actualHours: totalActual,
    variance: totalVariance,
    variancePercent,
    suggestions,
    details
  };
}

export async function validateTimeConsistency(
  entries: Array<{
    date: string;
    startTime: string;
    endTime: string;
    breakDuration?: number;
  }>
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    const { date, startTime, endTime, breakDuration = 0 } = entry;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      errors.push(`Format d'heure de début invalide: ${startTime}`);
      continue;
    }
    if (!timeRegex.test(endTime)) {
      errors.push(`Format d'heure de fin invalide: ${endTime}`);
      continue;
    }

    // Validate time logic
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    if (start >= end) {
      errors.push(`Heure de fin doit être après l'heure de début (${startTime} - ${endTime})`);
      continue;
    }

    // Calculate work duration
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakDuration;
    const workHours = workMinutes / 60;

    // Check for excessive daily hours
    if (workHours > 10) {
      errors.push(`Dépassement de 10h journalières le ${date}: ${workHours.toFixed(2)}h`);
    } else if (workHours > 8) {
      warnings.push(`Plus de 8h de travail le ${date}: ${workHours.toFixed(2)}h (heures supplémentaires)`);
    }

    // Check for insufficient breaks
    if (workHours > 6 && breakDuration < 20) {
      warnings.push(`Pause insuffisante le ${date}: ${breakDuration}min pour ${workHours.toFixed(2)}h de travail`);
    }

    // Check for very long days
    if (totalMinutes > 12 * 60) { // More than 12 hours including breaks
      warnings.push(`Journée très longue le ${date}: ${(totalMinutes/60).toFixed(2)}h au total`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export async function detectScheduleConflicts(
  employeeId?: number,
  startDate?: string,
  endDate?: string
): Promise<PlanningConflict[]> {
  const conflicts: PlanningConflict[] = [];

  // Période par défaut (semaine courante)
  const defaultStart = startDate || new Date().toISOString().split('T')[0];
  const defaultEnd = endDate || (() => {
    const end = new Date(defaultStart);
    end.setDate(end.getDate() + 6);
    return end.toISOString().split('T')[0];
  })();

  // Employés à vérifier
  let employeeIds: number[] = [];
  if (employeeId) {
    employeeIds = [employeeId];
  } else {
    const activeEmployees = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.is_active, true));
    employeeIds = activeEmployees.map(emp => emp.id);
  }

  // Vérifier chaque employé
  for (const empId of employeeIds) {
    const employeeConflicts = await detectEmployeeConflicts(empId, defaultStart, defaultEnd);
    conflicts.push(...employeeConflicts);
  }

  return conflicts;
}

async function detectEmployeeConflicts(
  employeeId: number,
  startDate: string,
  endDate: string
): Promise<PlanningConflict[]> {
  const conflicts: PlanningConflict[] = [];

  // Récupérer toutes les entrées de l'employé sur la période
  const entries = await db
    .select({
      id: planningEntries.id,
      date: planningEntries.date,
      startTime: planningEntries.start_time,
      endTime: planningEntries.end_time,
      type: planningEntries.type,
    })
    .from(planningEntries)
    .where(
      and(
        eq(planningEntries.employee_id, employeeId),
        gte(planningEntries.date, startDate),
        lte(planningEntries.date, endDate)
      )
    )
    .orderBy(asc(planningEntries.date), asc(planningEntries.start_time));

  // Grouper par jour
  const entriesByDate = entries.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  // Vérifier les conflits quotidiens
  for (const [date, dayEntries] of Object.entries(entriesByDate)) {
    const workEntries = dayEntries.filter(e => e.type === 'work');

    // Vérifier les chevauchements
    for (let i = 0; i < workEntries.length; i++) {
      for (let j = i + 1; j < workEntries.length; j++) {
        const entry1 = workEntries[i];
        const entry2 = workEntries[j];

        if (entry1.startTime && entry1.endTime && entry2.startTime && entry2.endTime) {
          const overlap = checkTimeOverlap(
            entry1.startTime, entry1.endTime,
            entry2.startTime, entry2.endTime
          );

          if (overlap) {
            conflicts.push({
              type: 'overlap',
              severity: 'error',
              employeeId,
              date,
              description: `Chevauchement d'horaires: ${entry1.startTime}-${entry1.endTime} et ${entry2.startTime}-${entry2.endTime}`,
              suggestions: [
                'Ajuster les heures de début/fin',
                'Supprimer l\'une des entrées',
                'Diviser en créneaux distincts'
              ],
              data: { entry1: entry1.id, entry2: entry2.id }
            });
          }
        }
      }
    }

    // Vérifier les heures quotidiennes
    let dailyHours = 0;
    workEntries.forEach(entry => {
      if (entry.startTime && entry.endTime) {
        dailyHours += calculateHoursBetween(entry.startTime, entry.endTime);
      }
    });

    if (dailyHours > LEGAL_CONSTRAINTS.maxDailyHours) {
      conflicts.push({
        type: 'max_daily_hours',
        severity: 'error',
        employeeId,
        date,
        description: `Dépassement de la limite quotidienne: ${dailyHours.toFixed(1)}h (max: ${LEGAL_CONSTRAINTS.maxDailyHours}h)`,
        suggestions: [
          'Réduire la durée des créneaux',
          'Reporter du travail sur d\'autres jours'
        ],
        data: { totalHours: dailyHours }
      });
    }
  }

  return conflicts;
}

// ============================================================================
// SUGGESTIONS DE RÉSOLUTION
// ============================================================================

export function suggestResolutions(conflicts: PlanningConflict[]): Array<{
  conflictType: string;
  priority: 'high' | 'medium' | 'low';
  actions: string[];
  automated: boolean;
}> {
  const suggestions = [];

  // Grouper par type de conflit
  const conflictsByType = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.type]) acc[conflict.type] = [];
    acc[conflict.type].push(conflict);
    return acc;
  }, {} as Record<string, PlanningConflict[]>);

  // Suggestions pour les chevauchements
  if (conflictsByType.overlap) {
    suggestions.push({
      conflictType: 'overlap',
      priority: 'high' as const,
      actions: [
        'Décaler automatiquement les créneaux en conflit',
        'Proposer des créneaux alternatifs',
        'Fusionner les créneaux adjacents'
      ],
      automated: true
    });
  }

  // Suggestions pour les dépassements quotidiens
  if (conflictsByType.max_daily_hours) {
    suggestions.push({
      conflictType: 'max_daily_hours',
      priority: 'high' as const,
      actions: [
        'Répartir automatiquement sur plusieurs jours',
        'Identifier les créneaux optimaux à réduire',
        'Proposer des jours de repos compensatoires'
      ],
      automated: true
    });
  }

  // Suggestions pour les dépassements hebdomadaires
  if (conflictsByType.max_weekly_hours) {
    suggestions.push({
      conflictType: 'max_weekly_hours',
      priority: 'medium' as const,
      actions: [
        'Répartir les heures sur plusieurs semaines',
        'Identifier les employés disponibles pour transfert',
        'Optimiser la planification globale'
      ],
      automated: false
    });
  }

  // Suggestions pour les périodes de repos insuffisantes
  if (conflictsByType.min_rest_period) {
    suggestions.push({
      conflictType: 'min_rest_period',
      priority: 'high' as const,
      actions: [
        'Décaler automatiquement les créneaux',
        'Proposer des créneaux le lendemain',
        'Ajuster les horaires de fin de journée précédente'
      ],
      automated: true
    });
  }

  return suggestions;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function calculateHoursBetween(startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function getWeekBounds(date: string): { weekStart: string; weekEnd: string } {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  
  // Calculer le lundi (début de semaine)
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() + mondayOffset);
  
  // Calculer le dimanche (fin de semaine)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0]
  };
}

export function checkTimeOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const startTime1 = new Date(`1970-01-01T${start1}:00`);
  const endTime1 = new Date(`1970-01-01T${end1}:00`);
  const startTime2 = new Date(`1970-01-01T${start2}:00`);
  const endTime2 = new Date(`1970-01-01T${end2}:00`);
  
  return startTime1 < endTime2 && startTime2 < endTime1;
}

export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}`;
}