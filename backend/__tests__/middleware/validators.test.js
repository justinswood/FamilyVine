/**
 * Unit tests for validation middleware
 */

const {
  validateMember,
  validateId,
  validateAlbum,
  validateRelationship,
  validateSearchQuery,
  isValidEmail,
  isValidPhone,
  isValidDate
} = require('../../middleware/validators');

describe('validators middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateMember', () => {
    it('should pass validation with valid member data', () => {
      req.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '555-1234',
        birth_date: '1990-01-01'
      };

      validateMember(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when first_name is missing', () => {
      req.body = {
        last_name: 'Doe'
      };

      validateMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['First name is required'])
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail when last_name is missing', () => {
      req.body = {
        first_name: 'John'
      };

      validateMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Last name is required'])
      });
    });

    it('should fail when first_name is too long', () => {
      req.body = {
        first_name: 'a'.repeat(300),
        last_name: 'Doe'
      };

      validateMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['First name must be less than 255 characters'])
      });
    });

    it('should fail with invalid email format', () => {
      req.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email'
      };

      validateMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Invalid email format'])
      });
    });

    it('should fail with invalid birth_date', () => {
      req.body = {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: 'not-a-date'
      };

      validateMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Invalid birth date'])
      });
    });

    it('should pass with empty optional fields', () => {
      req.body = {
        first_name: 'John',
        last_name: 'Doe'
      };

      validateMember(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateId', () => {
    it('should pass with valid integer id', () => {
      req.params = { id: '123' };
      const middleware = validateId('id');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail with non-numeric id', () => {
      req.params = { id: 'abc' };
      const middleware = validateId('id');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid id',
        details: ['id must be a positive integer']
      });
    });

    it('should fail with negative id', () => {
      req.params = { id: '-5' };
      const middleware = validateId('id');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail with zero id', () => {
      req.params = { id: '0' };
      const middleware = validateId('id');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should work with custom param name', () => {
      req.params = { memberId: 'abc' };
      const middleware = validateId('memberId');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid memberId',
        details: ['memberId must be a positive integer']
      });
    });
  });

  describe('validateRelationship', () => {
    it('should pass with valid relationship data', () => {
      req.body = {
        member1_id: 1,
        member2_id: 2,
        relationship_type: 'father'
      };

      validateRelationship(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail when member1_id is missing', () => {
      req.body = {
        member2_id: 2,
        relationship_type: 'father'
      };

      validateRelationship(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['member1_id must be a valid integer'])
      });
    });

    it('should fail when relationship_type is missing', () => {
      req.body = {
        member1_id: 1,
        member2_id: 2
      };

      validateRelationship(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['relationship_type is required'])
      });
    });

    it('should fail when creating relationship with self', () => {
      req.body = {
        member1_id: 1,
        member2_id: 1,
        relationship_type: 'father'
      };

      validateRelationship(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Cannot create relationship with self'])
      });
    });
  });

  describe('validateSearchQuery', () => {
    it('should pass with valid search query', () => {
      req.query = { q: 'John' };

      validateSearchQuery(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.q).toBe('John');
    });

    it('should sanitize dangerous characters', () => {
      req.query = { q: '<script>alert("xss")</script>' };

      validateSearchQuery(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.q).not.toContain('<');
      expect(req.query.q).not.toContain('>');
    });

    it('should fail when query is too long', () => {
      req.query = { q: 'a'.repeat(150) };

      validateSearchQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Search query too long',
        details: ['Search query must be less than 100 characters']
      });
    });

    it('should pass with empty query', () => {
      req.query = {};

      validateSearchQuery(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateAlbum', () => {
    it('should pass with valid album data', () => {
      req.body = { title: 'Family Reunion 2024' };

      validateAlbum(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail when title is missing', () => {
      req.body = {};

      validateAlbum(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Album title is required'])
      });
    });

    it('should fail when title is too long', () => {
      req.body = { title: 'a'.repeat(300) };

      validateAlbum(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining(['Album title must be less than 255 characters'])
      });
    });
  });

  describe('helper functions', () => {
    describe('isValidEmail', () => {
      it('should return true for valid email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      });

      it('should return false for invalid email', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(isValidEmail('missing@domain')).toBe(false);
        expect(isValidEmail('@nodomain.com')).toBe(false);
      });

      it('should return true for empty/null email (optional field)', () => {
        expect(isValidEmail('')).toBe(true);
        expect(isValidEmail(null)).toBe(true);
        expect(isValidEmail(undefined)).toBe(true);
      });
    });

    describe('isValidPhone', () => {
      it('should return true for valid phone numbers', () => {
        expect(isValidPhone('555-1234')).toBe(true);
        expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
        expect(isValidPhone('5551234567')).toBe(true);
      });

      it('should return true for empty phone (optional field)', () => {
        expect(isValidPhone('')).toBe(true);
        expect(isValidPhone(null)).toBe(true);
      });
    });

    describe('isValidDate', () => {
      it('should return true for valid dates', () => {
        expect(isValidDate('2024-01-15')).toBe(true);
        expect(isValidDate('1990-12-31')).toBe(true);
        expect(isValidDate(new Date().toISOString())).toBe(true);
      });

      it('should return false for invalid dates', () => {
        expect(isValidDate('not-a-date')).toBe(false);
        expect(isValidDate('2024-13-45')).toBe(false);
      });

      it('should return true for empty date (optional field)', () => {
        expect(isValidDate('')).toBe(true);
        expect(isValidDate(null)).toBe(true);
      });
    });
  });
});
