import { 
  calculateWorkedHours, 
  validateLegalConstraints, 
  detectPlanningConflicts,
  calculateOvertimeHours,
  isWithinDailyLimit,
  isWithinWeeklyLimit,
  hasMinimumRestPeriod
} from './businessLogic';
import { createTestTimeEntry, createTestEmployee } from '../tests/setup/backend.setup';

describe('Business Logic', () => {
  describe('calculateWorkedHours', () => {
    it('should calculate worked hours correctly without break', () => {
      const result = calculateWorkedHours('09:00', '17:00', 0);
      expect(result).toBe(8);
    });

    it('should calculate worked hours correctly with break', () => {
      const result = calculateWorkedHours('09:00', '17:00', 60);
      expect(result).toBe(7);
    });

    it('should handle cross-midnight time', () => {
      const result = calculateWorkedHours('22:00', '06:00', 0);
      expect(result).toBe(8);
    });

    it('should handle same start and end time', () => {
      const result = calculateWorkedHours('09:00', '09:00', 0);
      expect(result).toBe(0);
    });

    it('should handle break longer than work period', () => {
      const result = calculateWorkedHours('09:00', '10:00', 120);
      expect(result).toBe(0); // Ne peut pas être négatif
    });
  });

  describe('calculateOvertimeHours', () => {
    it('should calculate no overtime for normal hours', () => {
      const result = calculateOvertimeHours(7, 35);
      expect(result).toBe(0);
    });

    it('should calculate overtime for daily excess', () => {
      const result = calculateOvertimeHours(12, 35);
      expect(result).toBe(2); // 12 - 10 (limite légale quotidienne)
    });

    it('should calculate overtime for weekly excess', () => {
      const result = calculateOvertimeHours(8, 48);
      expect(result).toBe(0); // Pas d'heures sup quotidiennes, mais dépassement hebdomadaire
    });

    it('should prioritize daily overtime calculation', () => {
      const result = calculateOvertimeHours(12, 50);
      expect(result).toBe(2);
    });
  });

  describe('validateLegalConstraints', () => {
    it('should validate legal daily hours limit', () => {
      const timeEntry = {
        ...createTestTimeEntry(),
        startTime: '08:00',
        endTime: '18:00', // 10 heures
        breakDuration: 0
      };

      const result = validateLegalConstraints(timeEntry);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect daily hours violation', () => {
      const timeEntry = {
        ...createTestTimeEntry(),
        startTime: '08:00',
        endTime: '20:00', // 12 heures
        breakDuration: 0
      };

      const result = validateLegalConstraints(timeEntry);
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('DAILY_HOURS_EXCEEDED');
    });

    it('should validate mandatory break for long shifts', () => {
      const timeEntry = {
        ...createTestTimeEntry(),
        startTime: '08:00',
        endTime: '14:30', // 6.5 heures
        breakDuration: 20 // 20 minutes
      };

      const result = validateLegalConstraints(timeEntry);
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('INSUFFICIENT_BREAK');
    });

    it('should validate sufficient break for long shifts', () => {
      const timeEntry = {
        ...createTestTimeEntry(),
        startTime: '08:00',
        endTime: '14:30', // 6.5 heures
        breakDuration: 20 // 20 minutes minimum requis
      };

      const result = validateLegalConstraints(timeEntry);
      expect(result.violations).not.toContain('INSUFFICIENT_BREAK');
    });
  });

  describe('isWithinDailyLimit', () => {
    it('should return true for normal working hours', () => {
      expect(isWithinDailyLimit(8)).toBe(true);
      expect(isWithinDailyLimit(10)).toBe(true);
    });

    it('should return false for excessive daily hours', () => {
      expect(isWithinDailyLimit(11)).toBe(false);
      expect(isWithinDailyLimit(15)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isWithinDailyLimit(10)).toBe(true); // Exactement à la limite
      expect(isWithinDailyLimit(10.1)).toBe(false); // Juste au-dessus
      expect(isWithinDailyLimit(0)).toBe(true); // Pas d'heures
    });
  });

  describe('isWithinWeeklyLimit', () => {
    it('should return true for normal weekly hours', () => {
      expect(isWithinWeeklyLimit(35)).toBe(true);
      expect(isWithinWeeklyLimit(48)).toBe(true);
    });

    it('should return false for excessive weekly hours', () => {
      expect(isWithinWeeklyLimit(49)).toBe(false);
      expect(isWithinWeeklyLimit(60)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isWithinWeeklyLimit(48)).toBe(true); // Exactement à la limite
      expect(isWithinWeeklyLimit(48.1)).toBe(false); // Juste au-dessus
      expect(isWithinWeeklyLimit(0)).toBe(true); // Pas d'heures
    });
  });

  describe('hasMinimumRestPeriod', () => {
    it('should validate minimum rest between shifts', () => {
      const lastShiftEnd = new Date('2024-08-03T18:00:00');
      const nextShiftStart = new Date('2024-08-04T07:00:00');
      
      expect(hasMinimumRestPeriod(lastShiftEnd, nextShiftStart)).toBe(true);
    });

    it('should detect insufficient rest period', () => {
      const lastShiftEnd = new Date('2024-08-03T22:00:00');
      const nextShiftStart = new Date('2024-08-04T07:00:00'); // Seulement 9h de repos
      
      expect(hasMinimumRestPeriod(lastShiftEnd, nextShiftStart)).toBe(false);
    });

    it('should handle same day shifts', () => {
      const lastShiftEnd = new Date('2024-08-03T14:00:00');
      const nextShiftStart = new Date('2024-08-03T16:00:00'); // 2h de repos
      
      expect(hasMinimumRestPeriod(lastShiftEnd, nextShiftStart)).toBe(false);
    });
  });

  describe('detectPlanningConflicts', () => {
    it('should detect overlapping time entries', () => {
      const entries = [
        {
          ...createTestTimeEntry(),
          id: '1',
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '17:00'
        },
        {
          ...createTestTimeEntry(),
          id: '2',
          date: '2024-08-03',
          startTime: '16:00',
          endTime: '20:00'
        }
      ];

      const conflicts = detectPlanningConflicts(entries);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('OVERLAP');
      expect(conflicts[0].entryIds).toEqual(['1', '2']);
    });

    it('should detect adjacent entries without sufficient break', () => {
      const entries = [
        {
          ...createTestTimeEntry(),
          id: '1',
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '13:00'
        },
        {
          ...createTestTimeEntry(),
          id: '2',
          date: '2024-08-03',
          startTime: '13:00',
          endTime: '18:00'
        }
      ];

      const conflicts = detectPlanningConflicts(entries);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('INSUFFICIENT_BREAK');
    });

    it('should not detect conflicts for well-spaced entries', () => {
      const entries = [
        {
          ...createTestTimeEntry(),
          id: '1',
          date: '2024-08-03',
          startTime: '09:00',
          endTime: '12:00'
        },
        {
          ...createTestTimeEntry(),
          id: '2',
          date: '2024-08-03',
          startTime: '14:00',
          endTime: '18:00'
        }
      ];

      const conflicts = detectPlanningConflicts(entries);
      expect(conflicts).toHaveLength(0);
    });

    it('should detect excessive daily hours across multiple entries', () => {
      const entries = [
        {
          ...createTestTimeEntry(),
          id: '1',
          date: '2024-08-03',
          startTime: '08:00',
          endTime: '14:00' // 6h
        },
        {
          ...createTestTimeEntry(),
          id: '2',
          date: '2024-08-03',
          startTime: '15:00',
          endTime: '21:00' // 6h = 12h total
        }
      ];

      const conflicts = detectPlanningConflicts(entries);
      expect(conflicts.some(c => c.type === 'DAILY_HOURS_EXCEEDED')).toBe(true);
    });
  });
});