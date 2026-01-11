/**
 * NodeRenderer - Renders person cards for family tree
 * Creates SVG representations matching the FamilyTreeNode styling
 */

import { LayoutConfig } from '../layout/LayoutConfig.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class NodeRenderer {
  constructor(config = {}) {
    this.config = {
      nodeWidth: config.nodeWidth || LayoutConfig.NODE_WIDTH,
      nodeHeight: config.nodeHeight || LayoutConfig.NODE_HEIGHT,
      colors: config.colors || LayoutConfig.COLORS
    };

    // Create a cache for gradient definitions
    this.gradientCache = new Map();
  }

  /**
   * Create gradient definition for a gender
   * @param {SVGDefsElement} defs - SVG defs element
   * @param {string} gender - 'male', 'female', or 'unknown'
   * @param {string} gradientId - Unique ID for the gradient
   */
  createGradientDefinition(defs, gender, gradientId) {
    if (this.gradientCache.has(gradientId)) {
      return gradientId;
    }

    const colors = this.config.colors[gender] || this.config.colors.unknown;

    // Create linear gradient (top-left to bottom-right)
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', gradientId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    // Create three color stops for the gradient
    const stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', colors.light);

    const stop2 = document.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute('offset', '50%');
    stop2.setAttribute('stop-color', colors.medium);

    const stop3 = document.createElementNS(SVG_NS, 'stop');
    stop3.setAttribute('offset', '100%');
    stop3.setAttribute('stop-color', colors.dark);

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    gradient.appendChild(stop3);

    defs.appendChild(gradient);
    this.gradientCache.set(gradientId, true);

    return gradientId;
  }

  /**
   * Render a person node as an SVG group
   * @param {TreeNode} node - Tree node data
   * @param {SVGDefsElement} defs - SVG defs element for gradients
   * @param {Function} onNodeClick - Optional click handler
   * @returns {SVGGElement} SVG group element containing the node
   */
  renderNode(node, defs, onNodeClick = null) {
    // Create main group for the node
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'tree-node');
    group.setAttribute('data-node-id', node.id);
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);

    // Add click handler if provided
    if (onNodeClick) {
      group.style.cursor = 'pointer';
      group.addEventListener('click', () => onNodeClick(node));
    }

    // Create gradient for this node
    const gradientId = `node-gradient-${node.id}-${node.gender}`;
    this.createGradientDefinition(defs, node.gender, gradientId);

    // Create rounded rectangle background
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('width', this.config.nodeWidth);
    rect.setAttribute('height', this.config.nodeHeight);
    rect.setAttribute('rx', '8'); // Rounded corners
    rect.setAttribute('ry', '8');
    rect.setAttribute('fill', `url(#${gradientId})`);
    rect.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('class', 'node-background');

    // Add hover effect
    rect.style.transition = 'filter 0.2s';
    group.addEventListener('mouseenter', () => {
      rect.style.filter = 'brightness(1.1)';
    });
    group.addEventListener('mouseleave', () => {
      rect.style.filter = 'brightness(1)';
    });

    group.appendChild(rect);

    // Create circular clipping path for profile image
    const clipPathId = `clip-circle-${node.id}`;
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', clipPathId);

    const clipCircle = document.createElementNS(SVG_NS, 'circle');
    clipCircle.setAttribute('cx', this.config.nodeWidth / 2);
    clipCircle.setAttribute('cy', 50); // 12px padding + 50px radius
    clipCircle.setAttribute('r', 50);
    clipPath.appendChild(clipCircle);

    defs.appendChild(clipPath);

    // Create white circle border for profile image
    const borderCircle = document.createElementNS(SVG_NS, 'circle');
    borderCircle.setAttribute('cx', this.config.nodeWidth / 2);
    borderCircle.setAttribute('cy', 50);
    borderCircle.setAttribute('r', 50);
    borderCircle.setAttribute('fill', 'white');
    borderCircle.setAttribute('stroke', 'white');
    borderCircle.setAttribute('stroke-width', '4');
    group.appendChild(borderCircle);

    // Add profile image if available
    if (node.photoUrl) {
      const image = document.createElementNS(SVG_NS, 'image');
      image.setAttribute('x', this.config.nodeWidth / 2 - 50);
      image.setAttribute('y', 0);
      image.setAttribute('width', 100);
      image.setAttribute('height', 100);
      image.setAttribute('href', node.photoUrl);
      image.setAttribute('clip-path', `url(#${clipPathId})`);
      image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      image.setAttribute('class', 'node-image');

      // Handle image load errors
      image.addEventListener('error', () => {
        image.style.display = 'none';
      });

      group.appendChild(image);
    }

    // Add name text
    const fullName = `${node.firstName} ${node.lastName}`.trim();
    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', this.config.nodeWidth / 2);
    nameText.setAttribute('y', 115); // Below image
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', 'white');
    nameText.setAttribute('font-weight', 'bold');
    nameText.setAttribute('font-size', '16');
    nameText.setAttribute('class', 'node-name');
    nameText.textContent = fullName;

    // Truncate if too long
    if (fullName.length > 20) {
      nameText.textContent = fullName.substring(0, 18) + '...';
    }

    group.appendChild(nameText);

    // Add birth-death year text
    if (node.birthYear || node.deathYear) {
      const yearText = document.createElementNS(SVG_NS, 'text');
      yearText.setAttribute('x', this.config.nodeWidth / 2);
      yearText.setAttribute('y', 135); // Below name
      yearText.setAttribute('text-anchor', 'middle');
      yearText.setAttribute('fill', 'white');
      yearText.setAttribute('font-size', '13');
      yearText.setAttribute('class', 'node-years');

      const birthDisplay = node.birthYear || '?';
      const deathDisplay = node.deathYear ? ` - ${node.deathYear}` : '';
      yearText.textContent = `${birthDisplay}${deathDisplay}`;

      group.appendChild(yearText);
    }

    return group;
  }

  /**
   * Clear the gradient cache
   */
  clearCache() {
    this.gradientCache.clear();
  }
}

export default NodeRenderer;
