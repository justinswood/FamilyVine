/**
 * MiniMapRenderer - Mini-map for navigation
 * Shows a scaled overview of the entire tree with viewport indicator
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

export class MiniMapRenderer {
  constructor(container, mainSvg, config = {}) {
    this.container = container;
    this.mainSvg = mainSvg;
    this.config = {
      width: config.width || 200,
      height: config.height || 150,
      backgroundColor: config.backgroundColor || 'rgba(26, 26, 26, 0.9)',
      borderColor: config.borderColor || 'rgba(255, 255, 255, 0.2)',
      nodeColor: config.nodeColor || 'rgba(100, 149, 237, 0.6)',
      viewportColor: config.viewportColor || 'rgba(255, 255, 255, 0.3)',
      viewportStrokeColor: config.viewportStrokeColor || 'rgba(255, 255, 255, 0.8)',
      ...config
    };

    this.svg = null;
    this.contentGroup = null;
    this.viewportRect = null;
    this.treeModel = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.onClick = null;
  }

  /**
   * Initialize the mini-map SVG
   */
  initialize() {
    // Create SVG element
    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('width', this.config.width);
    this.svg.setAttribute('height', this.config.height);
    this.svg.style.backgroundColor = this.config.backgroundColor;
    this.svg.style.border = `1px solid ${this.config.borderColor}`;
    this.svg.style.borderRadius = '4px';
    this.svg.style.cursor = 'pointer';
    this.svg.setAttribute('class', 'minimap-svg');

    // Create content group
    this.contentGroup = document.createElementNS(SVG_NS, 'g');
    this.contentGroup.setAttribute('class', 'minimap-content');
    this.svg.appendChild(this.contentGroup);

    // Create viewport indicator rectangle
    this.viewportRect = document.createElementNS(SVG_NS, 'rect');
    this.viewportRect.setAttribute('fill', this.config.viewportColor);
    this.viewportRect.setAttribute('stroke', this.config.viewportStrokeColor);
    this.viewportRect.setAttribute('stroke-width', '2');
    this.viewportRect.setAttribute('class', 'minimap-viewport');
    this.svg.appendChild(this.viewportRect);

    // Add click handler
    this.svg.addEventListener('click', (e) => this.handleClick(e));

    // Append to container
    this.container.appendChild(this.svg);

    return this.svg;
  }

  /**
   * Render the tree on the mini-map
   * @param {TreeModel} treeModel - Tree model to render
   * @param {Object} viewportBounds - Current viewport bounds {x, y, width, height}
   */
  render(treeModel, viewportBounds = null) {
    if (!this.svg) {
      this.initialize();
    }

    this.treeModel = treeModel;

    // Clear existing content
    while (this.contentGroup.firstChild) {
      this.contentGroup.removeChild(this.contentGroup.firstChild);
    }

    // Get tree bounds
    const nodes = treeModel.getAllNodes();
    if (nodes.length === 0) {
      return;
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

    const treeBounds = { minX, minY, maxX, maxY };
    const treeWidth = maxX - minX;
    const treeHeight = maxY - minY;

    // Calculate scale to fit tree in mini-map
    const padding = 10;
    const availableWidth = this.config.width - (padding * 2);
    const availableHeight = this.config.height - (padding * 2);

    const scaleX = availableWidth / treeWidth;
    const scaleY = availableHeight / treeHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Calculate offset to center the tree
    this.offsetX = padding - (minX * this.scale);
    this.offsetY = padding - (minY * this.scale);

    // Render simplified nodes
    nodes.forEach(node => {
      const rect = document.createElementNS(SVG_NS, 'rect');
      const x = (node.x * this.scale) + this.offsetX;
      const y = (node.y * this.scale) + this.offsetY;
      const width = node.width * this.scale;
      const height = node.height * this.scale;

      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', width);
      rect.setAttribute('height', height);
      rect.setAttribute('fill', this.config.nodeColor);
      rect.setAttribute('rx', '2');
      rect.setAttribute('ry', '2');

      this.contentGroup.appendChild(rect);
    });

    // Update viewport indicator
    if (viewportBounds) {
      this.updateViewport(viewportBounds);
    }
  }

  /**
   * Update the viewport indicator rectangle
   * @param {Object} viewportBounds - Viewport bounds {x, y, width, height}
   */
  updateViewport(viewportBounds) {
    if (!this.viewportRect || !viewportBounds) {
      return;
    }

    const x = (viewportBounds.x * this.scale) + this.offsetX;
    const y = (viewportBounds.y * this.scale) + this.offsetY;
    const width = viewportBounds.width * this.scale;
    const height = viewportBounds.height * this.scale;

    this.viewportRect.setAttribute('x', x);
    this.viewportRect.setAttribute('y', y);
    this.viewportRect.setAttribute('width', width);
    this.viewportRect.setAttribute('height', height);
  }

  /**
   * Handle click on mini-map
   * @param {MouseEvent} event - Click event
   */
  handleClick(event) {
    if (!this.treeModel || !this.onClick) {
      return;
    }

    // Get click position relative to SVG
    const rect = this.svg.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert to tree coordinates
    const treeX = (clickX - this.offsetX) / this.scale;
    const treeY = (clickY - this.offsetY) / this.scale;

    // Call the click handler
    this.onClick({ x: treeX, y: treeY });
  }

  /**
   * Set the click handler
   * @param {Function} handler - Click handler function
   */
  setClickHandler(handler) {
    this.onClick = handler;
  }

  /**
   * Show the mini-map
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  /**
   * Hide the mini-map
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Clean up and destroy the mini-map
   */
  destroy() {
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg);
    }

    this.svg = null;
    this.contentGroup = null;
    this.viewportRect = null;
    this.treeModel = null;
    this.onClick = null;
  }
}

export default MiniMapRenderer;
