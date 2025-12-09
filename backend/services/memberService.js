/**
 * Member Service
 * Handles business logic for member operations
 */

const pool = require('../config/database');
const { parseDate } = require('../utils/dateUtils');

/**
 * Get all members
 * @returns {Promise<Array>} Array of member objects
 */
async function getAllMembers() {
  const query = 'SELECT * FROM members ORDER BY last_name, first_name';
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get member by ID
 * @param {number} memberId - Member ID
 * @returns {Promise<Object|null>} Member object or null if not found
 */
async function getMemberById(memberId) {
  const query = 'SELECT * FROM members WHERE id = $1';
  const result = await pool.query(query, [memberId]);
  return result.rows[0] || null;
}

/**
 * Create a new member
 * @param {Object} memberData - Member data
 * @returns {Promise<Object>} Created member object
 */
async function createMember(memberData) {
  const {
    first_name,
    middle_name,
    last_name,
    relationship,
    gender,
    is_alive,
    birth_date,
    death_date,
    birth_place,
    death_place,
    location,
    occupation,
    pronouns,
    email,
    phone,
    photo_url,
    is_married,
    marriage_date,
    spouse_id
  } = memberData;

  const query = `
    INSERT INTO members (
      first_name, middle_name, last_name, relationship, gender, is_alive,
      birth_date, death_date, birth_place, death_place, location, occupation,
      pronouns, email, phone, photo_url, is_married, marriage_date, spouse_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    RETURNING *
  `;

  const values = [
    first_name,
    middle_name || null,
    last_name,
    relationship || null,
    gender || null,
    is_alive !== undefined ? is_alive : true,
    parseDate(birth_date),
    parseDate(death_date),
    birth_place || null,
    death_place || null,
    location || null,
    occupation || null,
    pronouns || null,
    email || null,
    phone || null,
    photo_url || null,
    is_married || false,
    parseDate(marriage_date),
    spouse_id || null
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update an existing member
 * @param {number} memberId - Member ID
 * @param {Object} memberData - Updated member data
 * @returns {Promise<Object|null>} Updated member object or null if not found
 */
async function updateMember(memberId, memberData) {
  const {
    first_name,
    middle_name,
    last_name,
    relationship,
    gender,
    is_alive,
    birth_date,
    death_date,
    birth_place,
    death_place,
    location,
    occupation,
    pronouns,
    email,
    phone,
    photo_url,
    is_married,
    marriage_date,
    spouse_id
  } = memberData;

  const query = `
    UPDATE members SET
      first_name = $1,
      middle_name = $2,
      last_name = $3,
      relationship = $4,
      gender = $5,
      is_alive = $6,
      birth_date = $7,
      death_date = $8,
      birth_place = $9,
      death_place = $10,
      location = $11,
      occupation = $12,
      pronouns = $13,
      email = $14,
      phone = $15,
      photo_url = $16,
      is_married = $17,
      marriage_date = $18,
      spouse_id = $19
    WHERE id = $20
    RETURNING *
  `;

  const values = [
    first_name,
    middle_name || null,
    last_name,
    relationship || null,
    gender || null,
    is_alive !== undefined ? is_alive : true,
    parseDate(birth_date),
    parseDate(death_date),
    birth_place || null,
    death_place || null,
    location || null,
    occupation || null,
    pronouns || null,
    email || null,
    phone || null,
    photo_url || null,
    is_married || false,
    parseDate(marriage_date),
    spouse_id || null,
    memberId
  ];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

/**
 * Delete a member
 * @param {number} memberId - Member ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
async function deleteMember(memberId) {
  const query = 'DELETE FROM members WHERE id = $1';
  const result = await pool.query(query, [memberId]);
  return result.rowCount > 0;
}

/**
 * Update member photo URL
 * @param {number} memberId - Member ID
 * @param {string} photoUrl - Photo URL
 * @returns {Promise<Object|null>} Updated member object or null if not found
 */
async function updateMemberPhoto(memberId, photoUrl) {
  const query = 'UPDATE members SET photo_url = $1 WHERE id = $2 RETURNING *';
  const result = await pool.query(query, [photoUrl, memberId]);
  return result.rows[0] || null;
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  updateMemberPhoto
};
