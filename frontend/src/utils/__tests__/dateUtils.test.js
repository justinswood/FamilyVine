/**
 * Unit tests for frontend date utility functions
 */

import {
  formatDate,
  formatDateShort,
  getYear,
  calculateAge,
  createDate,
  parseDateToISO,
  isValidDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatLifeSpan,
  isFutureDate,
  isWithinDays,
  getMonthName,
  formatRelativeTime
} from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format valid date to long format', () => {
      const result = formatDate('2023-12-25');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should return null for invalid inputs', () => {
      expect(formatDate(null)).toBeNull();
      expect(formatDate('')).toBeNull();
      expect(formatDate('invalid-date')).toBeNull();
    });

    it('should support custom locales', () => {
      const result = formatDate('2023-12-25', 'en-GB');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatDateShort', () => {
    it('should format valid date to short format', () => {
      const result = formatDateShort('2023-12-25');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should return null for invalid inputs', () => {
      expect(formatDateShort(null)).toBeNull();
      expect(formatDateShort('')).toBeNull();
    });
  });

  describe('getYear', () => {
    it('should extract year from date string', () => {
      expect(getYear('2023-12-25')).toBe(2023);
      expect(getYear('1990-01-15')).toBe(1990);
    });

    it('should return null for invalid inputs', () => {
      expect(getYear(null)).toBeNull();
      expect(getYear('')).toBeNull();
      expect(getYear('invalid')).toBeNull();
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      expect(getYear(date)).toBe(2023);
    });
  });

  describe('calculateAge', () => {
    it('should calculate age for living persons', () => {
      const birthDate = '1990-01-01';
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(33);
      expect(typeof age).toBe('number');
    });

    it('should calculate age at death for deceased persons', () => {
      const birthDate = '1950-01-01';
      const deathDate = '2020-01-01';
      const age = calculateAge(birthDate, deathDate);
      expect(age).toBe(70);
    });

    it('should return null for invalid inputs', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('invalid')).toBeNull();
    });

    it('should handle future birth dates', () => {
      const futureBirthDate = '2030-01-01';
      const age = calculateAge(futureBirthDate);
      expect(age).toBeNull();
    });
  });

  describe('createDate', () => {
    it('should create Date object from year, month, day', () => {
      const date = createDate(2023, 12, 25);
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11); // 0-indexed
      expect(date.getDate()).toBe(25);
    });

    it('should return null for invalid inputs', () => {
      expect(createDate(null, 12, 25)).toBeNull();
      expect(createDate(2023, null, 25)).toBeNull();
      expect(createDate(2023, 12, null)).toBeNull();
    });
  });

  describe('parseDateToISO', () => {
    it('should parse date to YYYY-MM-DD format', () => {
      const result = parseDateToISO('December 25, 2023');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      const result = parseDateToISO(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return null for invalid inputs', () => {
      expect(parseDateToISO(null)).toBeNull();
      expect(parseDateToISO('')).toBeNull();
      expect(parseDateToISO('invalid')).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('December 25, 2023')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
    });

    it('should return false for invalid dates', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct number of days for each month', () => {
      expect(getDaysInMonth(2023, 1)).toBe(31); // January
      expect(getDaysInMonth(2023, 2)).toBe(28); // February (non-leap)
      expect(getDaysInMonth(2024, 2)).toBe(29); // February (leap year)
      expect(getDaysInMonth(2023, 4)).toBe(30); // April
      expect(getDaysInMonth(2023, 12)).toBe(31); // December
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return day of week for first day of month', () => {
      const result = getFirstDayOfMonth(2023, 0); // January 2023
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(6);
    });
  });

  describe('formatLifeSpan', () => {
    it('should format life span for living person', () => {
      const result = formatLifeSpan('1990-01-15', null, true);
      expect(result).toBe('b. 1990');
    });

    it('should format life span for deceased person with death date', () => {
      const result = formatLifeSpan('1950-03-20', '2020-06-15', false);
      expect(result).toBe('1950 - 2020');
    });

    it('should format life span for deceased person without death date', () => {
      const result = formatLifeSpan('1950-03-20', null, false);
      expect(result).toBe('1950 - ?');
    });

    it('should handle missing birth date', () => {
      const result = formatLifeSpan(null, '2020-06-15', false);
      expect(result).toBe('? - 2020');
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isFutureDate(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      expect(isFutureDate('2020-01-01')).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(isFutureDate(null)).toBe(false);
      expect(isFutureDate('')).toBe(false);
    });
  });

  describe('isWithinDays', () => {
    it('should return true for dates within N days', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isWithinDays(tomorrow, 7)).toBe(true);
    });

    it('should return false for dates beyond N days', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 100);
      expect(isWithinDays(farFuture, 7)).toBe(false);
    });

    it('should return false for past dates', () => {
      expect(isWithinDays('2020-01-01', 7)).toBe(false);
    });

    it('should return false for invalid inputs', () => {
      expect(isWithinDays(null, 7)).toBe(false);
      expect(isWithinDays('2023-12-25', null)).toBe(false);
    });
  });

  describe('getMonthName', () => {
    it('should return correct month names', () => {
      expect(getMonthName(1)).toBe('January');
      expect(getMonthName(6)).toBe('June');
      expect(getMonthName(12)).toBe('December');
    });

    it('should return empty string for invalid month numbers', () => {
      expect(getMonthName(0)).toBe('');
      expect(getMonthName(13)).toBe('');
      expect(getMonthName(-1)).toBe('');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Today" for current date', () => {
      const today = new Date();
      expect(formatRelativeTime(today)).toBe('Today');
    });

    it('should return "Tomorrow" for next day', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(formatRelativeTime(tomorrow)).toBe('Tomorrow');
    });

    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeTime(yesterday)).toBe('Yesterday');
    });

    it('should format days within a week', () => {
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      expect(formatRelativeTime(inThreeDays)).toBe('In 3 days');
    });

    it('should format days in past week', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
    });

    it('should return empty string for invalid inputs', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime('')).toBe('');
    });
  });
});
