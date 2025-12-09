/**
 * Relationship utility functions for the frontend
 * Provides helpers for working with family relationships
 */

/**
 * Relationship categories for grouping
 */
export const RELATIONSHIP_CATEGORIES = {
  IMMEDIATE: ['father', 'mother', 'son', 'daughter', 'husband', 'wife', 'brother', 'sister'],
  GRANDPARENT: ['grandfather', 'grandmother', 'grandson', 'granddaughter'],
  EXTENDED: ['uncle', 'aunt', 'niece', 'nephew', 'cousin'],
  SPOUSE: ['husband', 'wife'],
  PARENT: ['father', 'mother'],
  CHILD: ['son', 'daughter'],
  SIBLING: ['brother', 'sister']
};

/**
 * Get display label for a relationship type
 * @param {string} relationshipType - The relationship type
 * @returns {string} Display label
 */
export function getRelationshipLabel(relationshipType) {
  const labels = {
    'father': 'Father',
    'mother': 'Mother',
    'son': 'Son',
    'daughter': 'Daughter',
    'brother': 'Brother',
    'sister': 'Sister',
    'husband': 'Husband',
    'wife': 'Wife',
    'grandfather': 'Grandfather',
    'grandmother': 'Grandmother',
    'grandson': 'Grandson',
    'granddaughter': 'Granddaughter',
    'uncle': 'Uncle',
    'aunt': 'Aunt',
    'nephew': 'Nephew',
    'niece': 'Niece',
    'cousin': 'Cousin'
  };

  return labels[relationshipType] || relationshipType;
}

/**
 * Check if a relationship type is in a specific category
 * @param {string} relationshipType - The relationship type
 * @param {string} category - Category name (IMMEDIATE, PARENT, etc.)
 * @returns {boolean} True if relationship is in category
 */
export function isRelationshipInCategory(relationshipType, category) {
  const categoryTypes = RELATIONSHIP_CATEGORIES[category];
  return categoryTypes ? categoryTypes.includes(relationshipType) : false;
}

/**
 * Get relationship icon or emoji
 * @param {string} relationshipType - The relationship type
 * @returns {string} Icon/emoji representing the relationship
 */
export function getRelationshipIcon(relationshipType) {
  const icons = {
    'father': '👨',
    'mother': '👩',
    'son': '👦',
    'daughter': '👧',
    'brother': '👨‍👦',
    'sister': '👩‍👧',
    'husband': '🤵',
    'wife': '👰',
    'grandfather': '👴',
    'grandmother': '👵',
    'grandson': '👦',
    'granddaughter': '👧',
    'uncle': '👨',
    'aunt': '👩',
    'nephew': '👦',
    'niece': '👧',
    'cousin': '👥'
  };

  return icons[relationshipType] || '👤';
}

/**
 * Process and deduplicate relationships by person
 * Prioritizes outgoing relationships over incoming ones
 * @param {Array} relationships - Array of relationship objects
 * @returns {Array} Processed relationships with duplicates removed
 */
export function processRelationships(relationships) {
  if (!relationships || relationships.length === 0) return [];

  // Group relationships by the other person
  const relationshipsByPerson = {};

  relationships.forEach(rel => {
    const otherPersonId = rel.direction === 'outgoing' ? rel.member2_id : rel.member1_id;

    if (!relationshipsByPerson[otherPersonId]) {
      relationshipsByPerson[otherPersonId] = [];
    }
    relationshipsByPerson[otherPersonId].push(rel);
  });

  // For each person, prefer outgoing relationships
  const result = [];
  for (const personId in relationshipsByPerson) {
    const rels = relationshipsByPerson[personId];

    // Try to find an outgoing relationship first
    const outgoing = rels.find(r => r.direction === 'outgoing');
    if (outgoing) {
      result.push(outgoing);
    } else {
      // If no outgoing, use incoming
      result.push(rels[0]);
    }
  }

  return result;
}

/**
 * Combine parent relationships into a single "Parents" entry
 * @param {Array} relationships - Array of relationship objects
 * @returns {Array} Relationships with parents combined
 */
export function combineParentRelationships(relationships) {
  if (!relationships || relationships.length === 0) return [];

  // Find parent relationships - look for outgoing daughter/son relationships
  const parentRelationships = relationships.filter(rel => {
    // For outgoing relationships, check if this person is daughter/son to someone
    return rel.direction === 'outgoing' &&
           (rel.relationship_type === 'daughter' || rel.relationship_type === 'son');
  });

  // If we have exactly 2 parent relationships, combine them
  if (parentRelationships.length === 2) {
    const parent1 = parentRelationships[0];
    const parent2 = parentRelationships[1];

    // Create a combined "Parents" entry
    const combinedParents = {
      ...parent1,
      relationship_type: 'parents',
      related_first_name: `${parent1.related_first_name} & ${parent2.related_first_name}`,
      related_last_name: parent1.related_last_name,
      isCombined: true,
      parents: [
        {
          id: parent1.member2_id,
          name: `${parent1.related_first_name} ${parent1.related_last_name}`,
          photo: parent1.related_photo_url,
          type: parent1.relationship_type
        },
        {
          id: parent2.member2_id,
          name: `${parent2.related_first_name} ${parent2.related_last_name}`,
          photo: parent2.related_photo_url,
          type: parent2.relationship_type
        }
      ]
    };

    // Remove individual parent relationships and add combined one
    const nonParentRels = relationships.filter(rel =>
      !parentRelationships.includes(rel)
    );

    return [combinedParents, ...nonParentRels];
  }

  return relationships;
}

/**
 * Group relationships by category
 * @param {Array} relationships - Array of relationship objects
 * @returns {Object} Relationships grouped by category
 */
export function groupRelationshipsByCategory(relationships) {
  if (!relationships || relationships.length === 0) return {};

  const grouped = {
    parents: [],
    spouses: [],
    children: [],
    siblings: [],
    grandparents: [],
    extended: [],
    other: []
  };

  relationships.forEach(rel => {
    const type = rel.relationship_type;

    if (type === 'parents' || isRelationshipInCategory(type, 'PARENT')) {
      grouped.parents.push(rel);
    } else if (isRelationshipInCategory(type, 'SPOUSE')) {
      grouped.spouses.push(rel);
    } else if (isRelationshipInCategory(type, 'CHILD')) {
      grouped.children.push(rel);
    } else if (isRelationshipInCategory(type, 'SIBLING')) {
      grouped.siblings.push(rel);
    } else if (isRelationshipInCategory(type, 'GRANDPARENT')) {
      grouped.grandparents.push(rel);
    } else if (isRelationshipInCategory(type, 'EXTENDED')) {
      grouped.extended.push(rel);
    } else {
      grouped.other.push(rel);
    }
  });

  return grouped;
}

/**
 * Sort relationships by category priority
 * @param {Array} relationships - Array of relationship objects
 * @returns {Array} Sorted relationships
 */
export function sortRelationshipsByPriority(relationships) {
  if (!relationships || relationships.length === 0) return [];

  const priority = {
    'parents': 1,
    'father': 2,
    'mother': 3,
    'husband': 4,
    'wife': 5,
    'son': 6,
    'daughter': 7,
    'brother': 8,
    'sister': 9,
    'grandfather': 10,
    'grandmother': 11,
    'grandson': 12,
    'granddaughter': 13,
    'uncle': 14,
    'aunt': 15,
    'nephew': 16,
    'niece': 17,
    'cousin': 18
  };

  return [...relationships].sort((a, b) => {
    const aPriority = priority[a.relationship_type] || 999;
    const bPriority = priority[b.relationship_type] || 999;
    return aPriority - bPriority;
  });
}

/**
 * Get the reciprocal relationship type based on gender
 * @param {string} relationshipType - The relationship type
 * @param {string} gender - Gender of the other person ('Male' or 'Female')
 * @returns {string} Reciprocal relationship type
 */
export function getReciprocalRelationship(relationshipType, gender) {
  const mapping = {
    'father': gender === 'Male' ? 'son' : 'daughter',
    'mother': gender === 'Male' ? 'son' : 'daughter',
    'son': gender === 'Male' ? 'father' : 'mother',
    'daughter': gender === 'Male' ? 'father' : 'mother',
    'brother': gender === 'Male' ? 'brother' : 'sister',
    'sister': gender === 'Male' ? 'brother' : 'sister',
    'husband': 'wife',
    'wife': 'husband',
    'grandfather': gender === 'Male' ? 'grandson' : 'granddaughter',
    'grandmother': gender === 'Male' ? 'grandson' : 'granddaughter',
    'grandson': gender === 'Male' ? 'grandfather' : 'grandmother',
    'granddaughter': gender === 'Male' ? 'grandfather' : 'grandmother',
    'uncle': gender === 'Male' ? 'nephew' : 'niece',
    'aunt': gender === 'Male' ? 'nephew' : 'niece',
    'nephew': gender === 'Male' ? 'uncle' : 'aunt',
    'niece': gender === 'Male' ? 'uncle' : 'aunt',
    'cousin': 'cousin'
  };

  return mapping[relationshipType] || relationshipType;
}

/**
 * Format relationship display text
 * @param {Object} relationship - Relationship object
 * @returns {string} Formatted display text
 */
export function formatRelationshipDisplay(relationship) {
  if (!relationship) return '';

  const label = getRelationshipLabel(relationship.relationship_type);
  const name = `${relationship.related_first_name} ${relationship.related_last_name || ''}`.trim();

  return `${label}: ${name}`;
}
