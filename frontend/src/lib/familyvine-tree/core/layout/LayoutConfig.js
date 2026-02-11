/**
 * Layout Configuration
 * Constants and settings for the FamilyVine tree layout algorithm
 */

export const LayoutConfig = {
  // Vertical spacing
  GENERATION_HEIGHT: 200,   // Vertical spacing between generation lanes
  GENERATION_GAP: 80,       // Minimum vertical buffer between generations

  // Node dimensions
  NODE_WIDTH: 180,
  NODE_HEIGHT: 120,

  // Horizontal spacing
  SIBLING_SPACING: 28,      // Default gap between siblings (mixed leaf/branch)
  LEAF_SIBLING_SPACING: 20, // Tight gap between childless siblings
  BRANCH_SIBLING_SPACING: 40, // Gap between subtree bounding box edges
  SPOUSE_GAP: 24,           // Gap between partners in a union unit
  SUBTREE_SEPARATION: 40,   // Gap between different family subtrees

  // Zoom settings (pan & zoom handles wide trees)
  ZOOM_MIN: 0.2,
  ZOOM_MAX: 2.5,
  ZOOM_INITIAL: 1.0,
  FIT_MIN_ZOOM: 0.35,

  // 2-column layout disabled - use horizontal layout with pan/zoom
  SIBLING_SPLIT_THRESHOLD: 999,
  TWO_COL_GAP: 16,
  TWO_COL_ROW_GAP: 24,
  GHOST_PADDING: 16,

  // Color gradients for nodes (Greenhouse palette)
  COLORS: {
    male: {
      light: '#A8C5A0',
      medium: '#4A7C3F',
      dark: '#2D4F1E'
    },
    female: {
      light: '#D4B8A0',
      medium: '#A07050',
      dark: '#634832'
    },
    unknown: {
      light: '#D5D5D0',
      medium: '#9CA3AF',
      dark: '#6B7280'
    }
  },

  // Visual settings
  CONNECTOR_SIZE: 8,
  STROKE_WIDTH: 2,
  SPOUSE_STROKE_WIDTH: 2.5,

  // Animation settings
  TRANSITION_DURATION: 300,

  // Layout algorithm settings (Walker's algorithm)
  WALKER: {
    // Minimum distance between siblings
    MIN_SIBLING_DISTANCE: 16,
    // Distance between different family subtrees
    SUBTREE_SEPARATION: 40,
    // Distance between spouse partners
    SPOUSE_DISTANCE: 24,
    // Modifier value adjustment factor
    MOD_FACTOR: 1
  }
};

export default LayoutConfig;
