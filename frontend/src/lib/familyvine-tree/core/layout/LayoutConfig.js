/**
 * Layout Configuration
 * Constants and settings for the FamilyVine tree layout algorithm
 */

export const LayoutConfig = {
  // Vertical spacing
  GENERATION_HEIGHT: 250,

  // Node dimensions
  NODE_WIDTH: 200,
  NODE_HEIGHT: 155,

  // Horizontal spacing
  SIBLING_SPACING: 250,
  SPOUSE_GAP: 30,
  SUBTREE_SEPARATION: 100,

  // Zoom settings
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 2,
  ZOOM_INITIAL: 0.7,

  // Color gradients for nodes
  COLORS: {
    male: {
      light: '#dbeafe',
      medium: '#60a5fa',
      dark: '#3b82f6'
    },
    female: {
      light: '#fce7f3',
      medium: '#f472b6',
      dark: '#ec4899'
    },
    unknown: {
      light: '#e5e7eb',
      medium: '#9ca3af',
      dark: '#6b7280'
    }
  },

  // Visual settings
  CONNECTOR_SIZE: 10,
  STROKE_WIDTH: 3,
  SPOUSE_STROKE_WIDTH: 4,

  // Animation settings
  TRANSITION_DURATION: 300,

  // Layout algorithm settings (Walker's algorithm)
  WALKER: {
    // Minimum distance between siblings
    MIN_SIBLING_DISTANCE: 250,
    // Distance between different family subtrees
    SUBTREE_SEPARATION: 100,
    // Distance between spouse partners
    SPOUSE_DISTANCE: 30,
    // Modifier value adjustment factor
    MOD_FACTOR: 1
  }
};

export default LayoutConfig;
