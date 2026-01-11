/**
 * FamilyVine Tree - Core Library Exports
 *
 * Main entry point for the FamilyVine family tree visualization library
 */

// Main orchestrator
export { FamilyTree } from './FamilyTree.js';

// Data transformation
export { TreeModel } from './data/TreeModel.js';
export { transformGenerationsData, filterByMaxGeneration } from './data/DataTransformer.js';

// Layout
export { default as LayoutConfig } from './layout/LayoutConfig.js';
export { default as DEFAULT_CONFIG } from './layout/LayoutConfig.js';
export { WalkerLayout } from './layout/WalkerLayout.js';

// Rendering
export { SVGRenderer } from './renderer/SVGRenderer.js';
export { NodeRenderer } from './renderer/NodeRenderer.js';
export { EdgeRenderer } from './renderer/EdgeRenderer.js';
export { MiniMapRenderer } from './renderer/MiniMapRenderer.js';

// Interaction
export { PanZoomController } from './interaction/PanZoomController.js';
export { EventEmitter } from './interaction/EventEmitter.js';

// Default export
export default FamilyTree;
