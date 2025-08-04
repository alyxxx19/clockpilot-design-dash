// Logique métier pour les calculs d'heures et validations légales

export interface TimeEntry {
  id: string;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workedHours?: number;
  overtimeHours?: number;
  status: string;
  notes?: string;
}

export interface LegalValidationResult {
  isValid: boolean;
  violations: string[];
  warnings: string[];
}

export interface PlanningConflict {
  type: 'OVERLAP' | 'INSUFFICIENT_BREAK' | 'DAILY_HOURS_EXCEEDED' | 'INSUFFICIENT_REST';
  entryIds: string[];
  message: string;
  severity: 'ERROR' | 'WARNING';
}

// Constantes légales françaises
const DAILY_HOURS_LIMIT = 10; // Limite quotidienne légale
const WEEKLY_HOURS_LIMIT = 48; // Limite hebdomadaire légale
const MINIMUM_BREAK_DURATION = 20; // Pause minimum pour 6h+ de travail (en minutes)
const MINIMUM_REST_PERIOD = 11; // Repos minimum entre deux journées (en heures)
const BREAK_THRESHOLD = 6; // Seuil d'heures pour pause obligatoire

/**
 * Calcule les heures travaillées entre deux horaires
 */
export function calculateWorkedHours(startTime: string, endTime: string, breakDuration: number = 0): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  let totalMinutes = end - start;
  
  // Gérer le cas où l'horaire de fin est le lendemain
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60; // Ajouter 24h en minutes
  }
  
  // Soustraire la pause
  totalMinutes -= breakDuration;
  
  // S'assurer que le résultat n'est pas négatif
  totalMinutes = Math.max(0, totalMinutes);
  
  return Math.round((totalMinutes / 60) * 100) / 100; // Arrondir à 2 décimales
}

/**
 * Calcule les heures supplémentaires
 */
export function calculateOvertimeHours(workedHours: number, weeklyHours: number): number {
  // Heures sup quotidiennes (au-delà de 10h/jour)
  const dailyOvertime = Math.max(0, workedHours - DAILY_HOURS_LIMIT);
  
  // Pour les heures sup hebdomadaires, il faudrait le contexte de la semaine complète
  // Pour l'instant, on se base uniquement sur le quotidien
  return dailyOvertime;
}

/**
 * Valide les contraintes légales pour une entrée de temps
 */
export function validateLegalConstraints(timeEntry: TimeEntry): LegalValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  const workedHours = calculateWorkedHours(timeEntry.startTime, timeEntry.endTime, timeEntry.breakDuration);
  
  // Vérifier la limite quotidienne
  if (!isWithinDailyLimit(workedHours)) {
    violations.push('DAILY_HOURS_EXCEEDED');
  }
  
  // Vérifier la pause obligatoire
  if (workedHours >= BREAK_THRESHOLD && timeEntry.breakDuration < MINIMUM_BREAK_DURATION) {
    violations.push('INSUFFICIENT_BREAK');
  }
  
  // Avertissements pour les longues journées
  if (workedHours > 8) {
    warnings.push('LONG_WORKDAY');
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    warnings
  };
}

/**
 * Vérifie si les heures quotidiennes sont dans la limite légale
 */
export function isWithinDailyLimit(hours: number): boolean {
  return hours <= DAILY_HOURS_LIMIT;
}

/**
 * Vérifie si les heures hebdomadaires sont dans la limite légale
 */
export function isWithinWeeklyLimit(hours: number): boolean {
  return hours <= WEEKLY_HOURS_LIMIT;
}

/**
 * Vérifie si la période de repos minimum est respectée
 */
export function hasMinimumRestPeriod(lastShiftEnd: Date, nextShiftStart: Date): boolean {
  const restHours = (nextShiftStart.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60);
  return restHours >= MINIMUM_REST_PERIOD;
}

/**
 * Détecte les conflits dans une liste d'entrées de planning
 */
export function detectPlanningConflicts(entries: TimeEntry[]): PlanningConflict[] {
  const conflicts: PlanningConflict[] = [];
  
  // Grouper par employé et date
  const groupedEntries = groupEntriesByEmployeeAndDate(entries);
  
  for (const [key, dayEntries] of groupedEntries) {
    const [employeeId, date] = key.split('-');
    
    // Trier par heure de début
    const sortedEntries = dayEntries.sort((a, b) => 
      parseTime(a.startTime) - parseTime(b.startTime)
    );
    
    // Vérifier les chevauchements et pauses insuffisantes
    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const current = sortedEntries[i];
      const next = sortedEntries[i + 1];
      
      const currentEnd = parseTime(current.endTime);
      const nextStart = parseTime(next.startTime);
      
      // Chevauchement
      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'OVERLAP',
          entryIds: [current.id, next.id],
          message: `Chevauchement entre ${current.startTime}-${current.endTime} et ${next.startTime}-${next.endTime}`,
          severity: 'ERROR'
        });
      }
      // Pause insuffisante (moins de 20 minutes entre les créneaux)
      else if ((nextStart - currentEnd) < MINIMUM_BREAK_DURATION) {
        conflicts.push({
          type: 'INSUFFICIENT_BREAK',
          entryIds: [current.id, next.id],
          message: `Pause insuffisante entre les créneaux (${nextStart - currentEnd} minutes)`,
          severity: 'WARNING'
        });
      }
    }
    
    // Vérifier le total des heures quotidiennes
    const totalDailyHours = sortedEntries.reduce((total, entry) => {
      return total + calculateWorkedHours(entry.startTime, entry.endTime, entry.breakDuration);
    }, 0);
    
    if (totalDailyHours > DAILY_HOURS_LIMIT) {
      conflicts.push({
        type: 'DAILY_HOURS_EXCEEDED',
        entryIds: sortedEntries.map(e => e.id),
        message: `Dépassement de la limite quotidienne: ${totalDailyHours}h sur ${DAILY_HOURS_LIMIT}h autorisées`,
        severity: 'ERROR'
      });
    }
  }
  
  return conflicts;
}

// Fonctions utilitaires privées

/**
 * Parse une heure au format HH:MM en minutes depuis minuit
 */
function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Groupe les entrées par employé et date
 */
function groupEntriesByEmployeeAndDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  const grouped = new Map<string, TimeEntry[]>();
  
  for (const entry of entries) {
    const key = `${entry.employeeId}-${entry.date}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(entry);
  }
  
  return grouped;
}