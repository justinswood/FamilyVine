/**
 * Unit tests for memberService
 */

// Mock the database before requiring the service
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../../config/database');
const memberService = require('../../services/memberService');

describe('memberService', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    jest.clearAllMocks();
  });

  describe('getAllMembers', () => {
    it('should return all members ordered by name', async () => {
      const mockMembers = [
        { id: 1, first_name: 'Alice', last_name: 'Smith' },
        { id: 2, first_name: 'Bob', last_name: 'Jones' }
      ];

      pool.query.mockResolvedValue({ rows: mockMembers });

      const result = await memberService.getAllMembers();

      expect(result).toEqual(mockMembers);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM members ORDER BY last_name, first_name'
      );
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no members exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await memberService.getAllMembers();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(memberService.getAllMembers()).rejects.toThrow('Database error');
    });
  });

  describe('getMemberById', () => {
    it('should return member when found', async () => {
      const mockMember = { id: 1, first_name: 'Alice', last_name: 'Smith' };
      pool.query.mockResolvedValue({ rows: [mockMember] });

      const result = await memberService.getMemberById(1);

      expect(result).toEqual(mockMember);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM members WHERE id = $1', [1]);
    });

    it('should return null when member not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await memberService.getMemberById(999);

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(memberService.getMemberById(1)).rejects.toThrow('Database error');
    });
  });

  describe('createMember', () => {
    it('should create a new member with all fields', async () => {
      const memberData = {
        first_name: 'John',
        middle_name: 'William',
        last_name: 'Doe',
        relationship: 'self',
        gender: 'male',
        is_alive: true,
        birth_date: '1990-01-15',
        death_date: null,
        birth_place: 'New York, NY',
        death_place: null,
        location: 'Los Angeles, CA',
        occupation: 'Software Engineer',
        pronouns: 'he/him',
        email: 'john.doe@example.com',
        phone: '555-1234',
        photo_url: '/uploads/john.jpg',
        is_married: false,
        marriage_date: null,
        spouse_id: null
      };

      const mockCreatedMember = { id: 1, ...memberData };
      pool.query.mockResolvedValue({ rows: [mockCreatedMember] });

      const result = await memberService.createMember(memberData);

      expect(result).toEqual(mockCreatedMember);
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query.mock.calls[0][0]).toContain('INSERT INTO members');
    });

    it('should create member with minimal required fields', async () => {
      const memberData = {
        first_name: 'Jane',
        last_name: 'Smith'
      };

      const mockCreatedMember = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        is_alive: true,
        is_married: false
      };
      pool.query.mockResolvedValue({ rows: [mockCreatedMember] });

      const result = await memberService.createMember(memberData);

      expect(result.first_name).toBe('Jane');
      expect(result.last_name).toBe('Smith');
    });

    it('should handle date parsing correctly', async () => {
      const memberData = {
        first_name: 'Test',
        last_name: 'User',
        birth_date: '2000-12-25T10:30:00Z', // ISO format
        marriage_date: 'December 1, 2020' // Text format
      };

      pool.query.mockResolvedValue({ rows: [{ id: 1, ...memberData }] });

      await memberService.createMember(memberData);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const callArgs = pool.query.mock.calls[0][1];
      // Dates should be parsed to YYYY-MM-DD or null
      expect(callArgs[6]).toMatch(/^\d{4}-\d{2}-\d{2}$|null/);
    });
  });

  describe('updateMember', () => {
    it('should update existing member', async () => {
      const memberData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.updated@example.com',
        occupation: 'Senior Engineer'
      };

      const mockUpdatedMember = { id: 1, ...memberData };
      pool.query.mockResolvedValue({ rows: [mockUpdatedMember] });

      const result = await memberService.updateMember(1, memberData);

      expect(result).toEqual(mockUpdatedMember);
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query.mock.calls[0][0]).toContain('UPDATE members SET');
      expect(pool.query.mock.calls[0][1][19]).toBe(1); // memberId is last parameter
    });

    it('should return null when member not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await memberService.updateMember(999, { first_name: 'Test' });

      expect(result).toBeNull();
    });

    it('should handle partial updates', async () => {
      const partialData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      const mockUpdatedMember = { id: 1, ...partialData };
      pool.query.mockResolvedValue({ rows: [mockUpdatedMember] });

      const result = await memberService.updateMember(1, partialData);

      expect(result.first_name).toBe('Updated');
      expect(result.last_name).toBe('Name');
    });
  });

  describe('deleteMember', () => {
    it('should return true when member deleted successfully', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const result = await memberService.deleteMember(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM members WHERE id = $1', [1]);
    });

    it('should return false when member not found', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      const result = await memberService.deleteMember(999);

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Foreign key constraint violation'));

      await expect(memberService.deleteMember(1)).rejects.toThrow();
    });
  });

  describe('updateMemberPhoto', () => {
    it('should update member photo URL', async () => {
      const photoUrl = '/uploads/profile123.jpg';
      const mockUpdatedMember = { id: 1, photo_url: photoUrl };
      pool.query.mockResolvedValue({ rows: [mockUpdatedMember] });

      const result = await memberService.updateMemberPhoto(1, photoUrl);

      expect(result).toEqual(mockUpdatedMember);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE members SET photo_url = $1 WHERE id = $2 RETURNING *',
        [photoUrl, 1]
      );
    });

    it('should return null when member not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const result = await memberService.updateMemberPhoto(999, '/uploads/test.jpg');

      expect(result).toBeNull();
    });

    it('should handle null photo URL', async () => {
      const mockUpdatedMember = { id: 1, photo_url: null };
      pool.query.mockResolvedValue({ rows: [mockUpdatedMember] });

      const result = await memberService.updateMemberPhoto(1, null);

      expect(result.photo_url).toBeNull();
    });
  });
});
