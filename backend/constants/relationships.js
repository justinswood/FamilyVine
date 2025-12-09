/**
 * Relationship type constants and mappings for the family tree
 * Centralizes relationship logic to avoid duplication across routes
 */

/**
 * Define relationships with explicit inverse mappings
 * Each relationship type maps to its inverse and gender-specific inverse forms
 */
const RELATIONSHIP_MAPPING = {
  // Parent-Child relationships
  'father': { inverse: 'child', specific_inverse: { 'Male': 'son', 'Female': 'daughter' } },
  'mother': { inverse: 'child', specific_inverse: { 'Male': 'son', 'Female': 'daughter' } },
  'son': { inverse: 'parent', specific_inverse: { 'Male': 'father', 'Female': 'mother' } },
  'daughter': { inverse: 'parent', specific_inverse: { 'Male': 'father', 'Female': 'mother' } },

  // Sibling relationships
  'brother': { inverse: 'sibling', specific_inverse: { 'Male': 'brother', 'Female': 'sister' } },
  'sister': { inverse: 'sibling', specific_inverse: { 'Male': 'brother', 'Female': 'sister' } },

  // Spouse relationships
  'husband': { inverse: 'spouse', specific_inverse: { 'Male': 'husband', 'Female': 'wife' } },
  'wife': { inverse: 'spouse', specific_inverse: { 'Male': 'husband', 'Female': 'wife' } },

  // Extended family
  'uncle': { inverse: 'niece_or_nephew', specific_inverse: { 'Male': 'nephew', 'Female': 'niece' } },
  'aunt': { inverse: 'niece_or_nephew', specific_inverse: { 'Male': 'nephew', 'Female': 'niece' } },
  'niece': { inverse: 'uncle_or_aunt', specific_inverse: { 'Male': 'uncle', 'Female': 'aunt' } },
  'nephew': { inverse: 'uncle_or_aunt', specific_inverse: { 'Male': 'uncle', 'Female': 'aunt' } },

  // Cousins
  'cousin': { inverse: 'cousin', specific_inverse: { 'Male': 'cousin', 'Female': 'cousin' } },

  // Grandparent-Grandchild relationships
  'grandfather': { inverse: 'grandchild', specific_inverse: { 'Male': 'grandson', 'Female': 'granddaughter' } },
  'grandmother': { inverse: 'grandchild', specific_inverse: { 'Male': 'grandson', 'Female': 'granddaughter' } },
  'grandson': { inverse: 'grandparent', specific_inverse: { 'Male': 'grandfather', 'Female': 'grandmother' } },
  'granddaughter': { inverse: 'grandparent', specific_inverse: { 'Male': 'grandfather', 'Female': 'grandmother' } },
};

/**
 * List of all available relationship types
 */
const RELATIONSHIP_TYPES = Object.keys(RELATIONSHIP_MAPPING);

/**
 * Relationship categories for grouping/filtering
 */
const RELATIONSHIP_CATEGORIES = {
  IMMEDIATE: ['father', 'mother', 'son', 'daughter', 'husband', 'wife', 'brother', 'sister'],
  GRANDPARENT: ['grandfather', 'grandmother', 'grandson', 'granddaughter'],
  EXTENDED: ['uncle', 'aunt', 'niece', 'nephew', 'cousin'],
  SPOUSE: ['husband', 'wife'],
  PARENT: ['father', 'mother'],
  CHILD: ['son', 'daughter'],
  SIBLING: ['brother', 'sister']
};

/**
 * Get the inverse relationship type based on the source relationship
 * @param {string} sourceType - The source relationship type
 * @param {string} gender - The gender of the target member ('Male' or 'Female')
 * @returns {string|null} The inverse relationship type or null if not found
 */
function getInverseRelationshipType(sourceType, gender = null) {
  const mapping = RELATIONSHIP_MAPPING[sourceType];
  if (!mapping) return null;

  // Return gender-specific inverse if gender is provided
  if (gender && mapping.specific_inverse[gender]) {
    return mapping.specific_inverse[gender];
  }

  // Fallback to generic inverse
  return mapping.inverse;
}

/**
 * Check if a relationship type is valid
 * @param {string} relationshipType - The relationship type to validate
 * @returns {boolean} True if valid relationship type
 */
function isValidRelationshipType(relationshipType) {
  return RELATIONSHIP_TYPES.includes(relationshipType);
}

/**
 * Get relationship types by category
 * @param {string} category - Category name from RELATIONSHIP_CATEGORIES
 * @returns {Array<string>} Array of relationship types in that category
 */
function getRelationshipsByCategory(category) {
  return RELATIONSHIP_CATEGORIES[category] || [];
}

module.exports = {
  RELATIONSHIP_MAPPING,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_CATEGORIES,
  getInverseRelationshipType,
  isValidRelationshipType,
  getRelationshipsByCategory
};
