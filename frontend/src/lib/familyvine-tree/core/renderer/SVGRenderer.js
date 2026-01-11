/**
 * SVGRenderer - Main SVG rendering engine for the family tree
 * Coordinates node and edge rendering, manages SVG structure
 */

import { LayoutConfig } from '../layout/LayoutConfig.js';
import { NodeRenderer } from './NodeRenderer.js';
import { EdgeRenderer } from './EdgeRenderer.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class SVGRenderer {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      ...LayoutConfig,
      ...config
    };

    this.svg = null;
    this.defs = null;
    this.edgesGroup = null;
    this.nodesGroup = null;
    this.contentGroup = null;

    this.nodeRenderer = new NodeRenderer(this.config);
    this.edgeRenderer = new EdgeRenderer(this.config);

    this.onNodeClick = null;
  }

  /**
   * Initialize the SVG element
   * @param {number} width - Initial width
   * @param {number} height - Initial height
   */
  initialize(width, height) {
    // Create SVG element
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    // Use container dimensions as viewBox - CSS transforms handle pan/zoom
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.style.backgroundColor = '#1a1a1a'; // Dark background
    this.svg.style.overflow = 'hidden'; // Prevent content overflow
    this.svg.setAttribute('class', 'family-tree-svg');

    // Create defs element for gradients and clip paths
    this.defs = document.createElementNS(SVG_NS, 'defs');
    this.svg.appendChild(this.defs);

    // Create content group (will be transformed for pan/zoom)
    this.contentGroup = document.createElementNS(SVG_NS, 'g');
    this.contentGroup.setAttribute('class', 'content-group');
    // Set transform origin to top-left for predictable transforms
    this.contentGroup.style.transformOrigin = '0 0';
    this.svg.appendChild(this.contentGroup);

    // Create edges group (rendered behind nodes)
    this.edgesGroup = document.createElementNS(SVG_NS, 'g');
    this.edgesGroup.setAttribute('class', 'edges-group');
    this.contentGroup.appendChild(this.edgesGroup);

    // Create nodes group (rendered in front of edges)
    this.nodesGroup = document.createElementNS(SVG_NS, 'g');
    this.nodesGroup.setAttribute('class', 'nodes-group');
    this.contentGroup.appendChild(this.nodesGroup);

    // Append to container
    this.container.appendChild(this.svg);

    return this.svg;
  }

  /**
   * Create gradient definitions for all genders
   */
  createGradients() {
    const genders = ['male', 'female', 'unknown'];

    genders.forEach(gender => {
      const gradientId = `gradient-${gender}`;
      this.nodeRenderer.createGradientDefinition(this.defs, gender, gradientId);
    });
  }

  /**
   * Render the complete tree
   * @param {TreeModel} treeModel - Tree model to render
   */
  render(treeModel) {
    if (!this.svg) {
      throw new Error('SVGRenderer not initialized. Call initialize() first.');
    }

    // Clear existing content
    this.clear();

    // Create gradients
    this.createGradients();

    // Render all edges first (so they appear behind nodes)
    const edges = this.edgeRenderer.renderAllEdges(treeModel);
    edges.forEach(edge => {
      this.edgesGroup.appendChild(edge);
    });

    // Render all nodes
    const nodes = treeModel.getAllNodes();
    nodes.forEach(node => {
      const nodeElement = this.nodeRenderer.renderNode(
        node,
        this.defs,
        this.onNodeClick
      );
      this.nodesGroup.appendChild(nodeElement);
    });

    // Log bounds for debugging (don't modify viewBox - PanZoomController handles positioning)
    const bounds = this.getBounds(treeModel);
    console.log('📐 Tree bounds:', bounds);
  }

  /**
   * Clear all rendered content
   */
  clear() {
    // Clear edges
    while (this.edgesGroup.firstChild) {
      this.edgesGroup.removeChild(this.edgesGroup.firstChild);
    }

    // Clear nodes
    while (this.nodesGroup.firstChild) {
      this.nodesGroup.removeChild(this.nodesGroup.firstChild);
    }

    // Clear defs (except we'll keep them and regenerate)
    while (this.defs.firstChild) {
      this.defs.removeChild(this.defs.firstChild);
    }

    // Clear node renderer cache
    this.nodeRenderer.clearCache();
  }

  /**
   * Calculate bounding box of all nodes
   * @param {TreeModel} treeModel - Tree model
   * @returns {Object|null} Bounds object with minX, minY, maxX, maxY
   */
  getBounds(treeModel) {
    const nodes = treeModel.getAllNodes();
    if (nodes.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    return { minX, minY, maxX, maxY };
  }

  /**
   * Set the node click handler
   * @param {Function} handler - Click handler function
   */
  setNodeClickHandler(handler) {
    this.onNodeClick = handler;
  }

  /**
   * Get the content group (for pan/zoom transformations)
   * @returns {SVGGElement} Content group element
   */
  getContentGroup() {
    return this.contentGroup;
  }

  /**
   * Get the SVG element
   * @returns {SVGSVGElement} SVG element
   */
  getSVG() {
    return this.svg;
  }

  /**
   * Update the viewBox
   * @param {number} x - ViewBox x
   * @param {number} y - ViewBox y
   * @param {number} width - ViewBox width
   * @param {number} height - ViewBox height
   */
  setViewBox(x, y, width, height) {
    if (this.svg) {
      this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
    }
  }

  /**
   * Get current viewBox
   * @returns {Object} ViewBox object with x, y, width, height
   */
  getViewBox() {
    if (!this.svg) {
      return null;
    }

    const viewBox = this.svg.getAttribute('viewBox');
    if (!viewBox) {
      return null;
    }

    const [x, y, width, height] = viewBox.split(' ').map(Number);
    return { x, y, width, height };
  }

  /**
   * Resize the SVG
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (this.svg) {
      this.svg.setAttribute('width', width);
      this.svg.setAttribute('height', height);
    }
  }

  /**
   * Clean up and destroy the renderer
   */
  destroy() {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }

    this.svg = null;
    this.defs = null;
    this.edgesGroup = null;
    this.nodesGroup = null;
    this.contentGroup = null;
    this.nodeRenderer = null;
    this.edgeRenderer = null;
  }
}

export default SVGRenderer;
