/**
 * FamilyTree - Main orchestrator class
 * Ties together all components: data, layout, rendering, and interaction
 */

import { EventEmitter } from './interaction/EventEmitter.js';
import { transformGenerationsData, filterByMaxGeneration } from './data/DataTransformer.js';
import { WalkerLayout } from './layout/WalkerLayout.js';
import { SVGRenderer } from './renderer/SVGRenderer.js';
import { PanZoomController } from './interaction/PanZoomController.js';
import { MiniMapRenderer } from './renderer/MiniMapRenderer.js';
import LayoutConfig from './layout/LayoutConfig.js';

export class FamilyTree {
  constructor(container, config = {}) {
    // Validate container
    if (!container) {
      throw new Error('FamilyTree requires a container element');
    }

    this.container = container;
    this.config = {
      ...LayoutConfig,
      ...config
    };

    // Store apiUrl for image paths
    this.apiUrl = config.apiUrl || '';

    // Store mini-map container
    this.miniMapContainer = config.miniMapContainer || null;

    // Event system
    this.events = new EventEmitter();

    // State
    this.treeModel = null;
    this.maxGenerations = 4;
    this.currentBounds = null;

    // Components
    this.renderer = null;
    this.layout = null;
    this.panZoom = null;
    this.miniMap = null;

    // Callbacks
    this.onNodeClick = config.onNodeClick || null;

    // Initialize components
    this._initializeComponents();
  }

  /**
   * Initialize all components
   * @private
   */
  _initializeComponents() {
    console.log('🚀 Initializing FamilyTree components');

    // Get container dimensions
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // Create SVG renderer
    this.renderer = new SVGRenderer(this.container, this.config);
    this.renderer.initialize(width, height);

    // Set node click handler
    if (this.onNodeClick) {
      this.renderer.setNodeClickHandler(this.onNodeClick);
    }

    // Create layout engine
    this.layout = new WalkerLayout(this.config);

    // Create pan/zoom controller
    this.panZoom = new PanZoomController(this.renderer.getSVG(), this.config);
    this.panZoom.setContentGroup(this.renderer.getContentGroup());
    this.panZoom.setupEventListeners();

    // Create mini-map if container provided
    if (this.miniMapContainer) {
      this.miniMap = new MiniMapRenderer(
        this.miniMapContainer,
        this.renderer.getSVG(),
        this.config.miniMap || {}
      );
      this.miniMap.initialize();

      // Set mini-map click handler to center on clicked position
      this.miniMap.setClickHandler((position) => {
        this.panZoom.centerOn(position.x, position.y);
      });

      // Update mini-map viewport when transform changes
      this.panZoom.setTransformChangeCallback((transform) => {
        if (this.miniMap && this.currentBounds) {
          // Calculate viewport bounds in tree coordinates
          const svgRect = this.renderer.getSVG().getBoundingClientRect();
          const viewportWidth = svgRect.width / transform.zoom;
          const viewportHeight = svgRect.height / transform.zoom;
          const viewportX = -transform.panX / transform.zoom;
          const viewportY = -transform.panY / transform.zoom;

          this.miniMap.updateViewport({
            x: viewportX,
            y: viewportY,
            width: viewportWidth,
            height: viewportHeight
          });
        }
      });
    }

    console.log('✅ FamilyTree initialized');
  }

  /**
   * Set data and render the tree
   * @param {Array} generationsData - Backend API generations data
   * @param {number} maxGenerations - Maximum generations to display
   */
  setData(generationsData, maxGenerations = 4) {
    console.log('📊 Setting tree data:', generationsData.length, 'generations');

    this.maxGenerations = maxGenerations;

    // Transform data to TreeModel
    this.treeModel = transformGenerationsData(
      generationsData,
      this.apiUrl
    );

    // Filter by max generations if specified
    if (maxGenerations && maxGenerations < this.treeModel.getMaxGeneration()) {
      this.treeModel = filterByMaxGeneration(this.treeModel, maxGenerations);
      console.log(`🔽 Filtered to ${maxGenerations} generations`);
    }

    // Calculate layout
    console.log('📐 Calculating layout...');
    this.layout.calculate(this.treeModel);

    // Render the tree
    console.log('🎨 Rendering tree...');
    this.renderer.render(this.treeModel);

    // Get bounds
    this.currentBounds = this.renderer.getBounds(this.treeModel);

    // Fit to view
    this.fitToView();

    // Update mini-map
    if (this.miniMap && this.currentBounds) {
      const transform = this.panZoom.getTransform();
      const svgRect = this.renderer.getSVG().getBoundingClientRect();
      const viewportWidth = svgRect.width / transform.zoom;
      const viewportHeight = svgRect.height / transform.zoom;
      const viewportX = -transform.panX / transform.zoom;
      const viewportY = -transform.panY / transform.zoom;

      this.miniMap.render(this.treeModel, {
        x: viewportX,
        y: viewportY,
        width: viewportWidth,
        height: viewportHeight
      });
    }

    // Emit event
    this.events.emit('dataLoaded', {
      nodeCount: this.treeModel.getNodeCount(),
      maxGeneration: this.treeModel.getMaxGeneration()
    });

    console.log('✅ Tree rendered successfully');
  }

  /**
   * Handle container resize
   */
  handleResize() {
    console.log('🔄 Handling resize');

    if (!this.treeModel || !this.currentBounds) {
      return;
    }

    // Get new container dimensions
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    // Update renderer size
    this.renderer.resize(width, height);

    // Re-fit to view
    this.fitToView();

    // Update mini-map
    if (this.miniMap) {
      const transform = this.panZoom.getTransform();
      const svgRect = this.renderer.getSVG().getBoundingClientRect();
      const viewportWidth = svgRect.width / transform.zoom;
      const viewportHeight = svgRect.height / transform.zoom;
      const viewportX = -transform.panX / transform.zoom;
      const viewportY = -transform.panY / transform.zoom;

      this.miniMap.render(this.treeModel, {
        x: viewportX,
        y: viewportY,
        width: viewportWidth,
        height: viewportHeight
      });
    }
  }

  /**
   * Fit tree to viewport
   * @param {number} padding - Padding around the tree
   */
  fitToView(padding = 50) {
    if (!this.currentBounds || !this.panZoom) {
      return;
    }

    this.panZoom.fitToView(this.currentBounds, padding);
  }

  /**
   * Center view on a specific node
   * @param {number|string} nodeId - Node ID to center on
   */
  centerOnNode(nodeId) {
    if (!this.treeModel) {
      return;
    }

    const node = this.treeModel.getNode(nodeId);
    if (!node) {
      console.warn(`Node ${nodeId} not found`);
      return;
    }

    // Center on node position
    const centerX = node.x + (node.width / 2);
    const centerY = node.y + (node.height / 2);

    this.panZoom.centerOn(centerX, centerY);
  }

  /**
   * Set the node click handler
   * @param {Function} callback - Callback function (nodeId) => void
   */
  setNodeClickHandler(callback) {
    this.onNodeClick = callback;
    if (this.renderer) {
      this.renderer.setNodeClickHandler(callback);
    }
  }

  /**
   * Get current tree bounds
   * @returns {Object|null} Bounds object {minX, minY, maxX, maxY}
   */
  getBounds() {
    return this.currentBounds;
  }

  /**
   * Get the tree model
   * @returns {TreeModel|null} Current tree model
   */
  getTreeModel() {
    return this.treeModel;
  }

  /**
   * Get current zoom level
   * @returns {number} Current zoom
   */
  getZoom() {
    return this.panZoom ? this.panZoom.getTransform().zoom : 1;
  }

  /**
   * Set zoom level
   * @param {number} zoom - Zoom level
   * @param {boolean} animated - Whether to animate
   */
  setZoom(zoom, animated = true) {
    if (this.panZoom) {
      const transform = this.panZoom.getTransform();
      this.panZoom.setTransform({ ...transform, zoom }, animated);
    }
  }

  /**
   * Reset zoom and pan to initial state
   */
  reset() {
    if (this.panZoom) {
      this.panZoom.reset();
    }
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    return this.events.on(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    this.events.off(event, callback);
  }

  /**
   * Clean up and destroy the tree
   */
  destroy() {
    console.log('🧹 Destroying FamilyTree');

    // Destroy components
    if (this.panZoom) {
      this.panZoom.destroy();
      this.panZoom = null;
    }

    if (this.miniMap) {
      this.miniMap.destroy();
      this.miniMap = null;
    }

    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }

    // Clear state
    this.treeModel = null;
    this.currentBounds = null;
    this.layout = null;

    // Clear events
    this.events.clear();

    console.log('✅ FamilyTree destroyed');
  }
}

export default FamilyTree;
