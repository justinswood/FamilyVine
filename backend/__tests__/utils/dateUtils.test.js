/**
 * Unit tests for date utility functions
 */

const { parseDate, formatDate, isValidDate, calculateAge } = require('../../utils/dateUtils');

describe('dateUtils', () => {
  describe('parseDate', () => {
    it('should return null for invalid inputs', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate('null')).toBeNull();
      expect(parseDate('undefined')).toBeNull();
      expect(parseDate('')).toBeNull();
    });

    it('should handle YYYY-MM-DD format', () => {
      expect(parseDate('2023-12-25')).toBe('2023-12-25');
      expect(parseDate('1990-01-15')).toBe('1990-01-15');
    });

    it('should handle ISO format with time', () => {
      const result = parseDate('2023-12-25T10:30:00Z');
      expect(result).toBe('2023-12-25');
    });

    it('should handle ISO format with timezone', () => {
      const result = parseDate('2023-12-25T10:30:00+05:30');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      const result = parseDate(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle various date string formats', () => {
      expect(parseDate('December 25, 2023')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(parseDate('12/25/2023')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return null for invalid date strings', () => {
      expect(parseDate('not a date')).toBeNull();
      expect(parseDate('invalid-date-format')).toBeNull();
    });
  });

  describe('formatDate', () => {
    it('should return null for invalid inputs', () => {
      expect(formatDate(null)).toBeNull();
      expect(formatDate(undefined)).toBeNull();
      expect(formatDate('')).toBeNull();
    });

    it('should format valid dates in en-US locale', () => {
      const result = formatDate('2023-12-25');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      const result = formatDate(date);
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });

    it('should support custom locales', () => {
      const result = formatDate('2023-12-25', 'en-GB');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return null for invalid date strings', () => {
      expect(formatDate('not a date')).toBeNull();
      expect(formatDate('invalid')).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return false for invalid inputs', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('not a date')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
    });

    it('should return true for valid dates', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('1990-01-15')).toBe(true);
      expect(isValidDate('December 25, 2023')).toBe(true);
      expect(isValidDate('12/25/2023')).toBe(true);
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-12-25');
      expect(isValidDate(date)).toBe(true);
    });
  });

  describe('calculateAge', () => {
    it('should return null for invalid inputs', () => {
      expect(calculateAge(null)).toBeNull();
      expect(calculateAge(undefined)).toBeNull();
      expect(calculateAge('')).toBeNull();
      expect(calculateAge('not a date')).toBeNull();
    });

    it('should calculate age for living persons', () => {
      const birthDate = '1990-01-01';
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(33); // As of 2023+
      expect(typeof age).toBe('number');
    });

    it('should calculate age at death for deceased persons', () => {
      const birthDate = '1950-01-01';
      const deathDate = '2020-01-01';
      const age = calculateAge(birthDate, deathDate);
      expect(age).toBe(70);
    });

    it('should handle birthday not yet reached this year', () => {
      const currentYear = new Date().getFullYear();
      const nextMonth = new Date().getMonth() + 2; // Future month
      const birthDate = `${currentYear - 25}-${String(nextMonth).padStart(2, '0')}-15`;
      const age = calculateAge(birthDate);

      // Age should be 24 since birthday hasn't happened yet this year
      expect(age).toBeGreaterThanOrEqual(24);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should return null for future birth dates', () => {
      const futureBirthDate = '2030-01-01';
      const age = calculateAge(futureBirthDate);
      expect(age).toBeNull();
    });

    it('should handle edge case of same birth and death date', () => {
      const date = '2023-01-01';
      const age = calculateAge(date, date);
      expect(age).toBe(0);
    });

    it('should handle invalid death date', () => {
      const birthDate = '1990-01-01';
      const invalidDeathDate = 'not a date';
      const age = calculateAge(birthDate, invalidDeathDate);
      expect(age).toBeNull();
    });
  });
});
