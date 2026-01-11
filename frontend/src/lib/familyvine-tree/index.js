/**
 * FamilyVine Tree Library
 * Main entry point for both vanilla JS and React usage
 */

// Core library
export {
  FamilyTree,
  TreeModel,
  transformGenerationsData,
  filterByMaxGeneration,
  LayoutConfig,
  DEFAULT_CONFIG
} from './core/index.js';

// React components
export {
  FamilyTreeView,
  useFamilyTree
} from './react/index.js';

// Default export - core FamilyTree class
export { FamilyTree as default } from './core/FamilyTree.js';
