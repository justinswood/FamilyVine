/**
 * EdgeRenderer - Renders connection lines between nodes
 * Handles spouse connections (horizontal) and parent-child connections (orthogonal)
 */

import { LayoutConfig } from '../layout/LayoutConfig.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class EdgeRenderer {
  constructor(config = {}) {
    this.config = {
      strokeWidth: config.strokeWidth || LayoutConfig.STROKE_WIDTH,
      spouseStrokeWidth: config.spouseStrokeWidth || LayoutConfig.SPOUSE_STROKE_WIDTH,
      strokeColor: config.strokeColor || '#ffffff'
    };
  }

  /**
   * Render a spouse edge - horizontal line between partners
   * @param {TreeNode} node1 - First spouse node
   * @param {TreeNode} node2 - Second spouse node
   * @returns {SVGPathElement} SVG path element
   */
  renderSpouseEdge(node1, node2) {
    // Calculate positions - connect from right edge of left node to left edge of right node
    const leftNode = node1.x < node2.x ? node1 : node2;
    const rightNode = node1.x < node2.x ? node2 : node1;

    const x1 = leftNode.x + leftNode.width;
    const y1 = leftNode.y + leftNode.height / 2;
    const x2 = rightNode.x;
    const y2 = rightNode.y + rightNode.height / 2;

    // Create horizontal path
    const path = document.createElementNS(SVG_NS, 'path');
    const pathData = `M ${x1},${y1} L ${x2},${y2}`;

    path.setAttribute('d', pathData);
    path.setAttribute('stroke', this.config.strokeColor);
    path.setAttribute('stroke-width', this.config.spouseStrokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'spouse-edge');

    return path;
  }

  /**
   * Render a parent-child edge - orthogonal path from parents to child
   * @param {TreeNode} child - Child node
   * @param {Array<TreeNode>} parents - Array of parent nodes (1-2 elements)
   * @param {number} parentCohortCenter - X coordinate of parent cohort center
   * @returns {SVGPathElement} SVG path element
   */
  renderParentChildEdge(child, parents, parentCohortCenter) {
    if (!parents || parents.length === 0) {
      return null;
    }

    // Calculate the midpoint between parents or the single parent position
    let parentX, parentY;

    if (parents.length === 2) {
      // Two parents - use the midpoint between them
      parentX = (parents[0].x + parents[0].width / 2 + parents[1].x + parents[1].width / 2) / 2;
      parentY = Math.max(parents[0].y + parents[0].height, parents[1].y + parents[1].height);
    } else {
      // Single parent
      const parent = parents[0];
      parentX = parent.x + parent.width / 2;
      parentY = parent.y + parent.height;
    }

    // Child connection point (top center)
    const childX = child.x + child.width / 2;
    const childY = child.y;

    // Create orthogonal path:
    // 1. Down from parent bottom
    // 2. Horizontal to child x position
    // 3. Down to child top
    const midY = parentY + (childY - parentY) / 2;

    const pathData = `
      M ${parentX},${parentY}
      L ${parentX},${midY}
      L ${childX},${midY}
      L ${childX},${childY}
    `;

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', pathData.trim());
    path.setAttribute('stroke', this.config.strokeColor);
    path.setAttribute('stroke-width', this.config.strokeWidth);
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'parent-child-edge');

    return path;
  }

  /**
   * Render all edges for the tree
   * @param {TreeModel} treeModel - Tree model containing all nodes
   * @returns {Array<SVGPathElement>} Array of SVG path elements
   */
  renderAllEdges(treeModel) {
    const edges = [];
    const processedSpousePairs = new Set();

    console.log('🔗 EdgeRenderer: Rendering edges for', treeModel.getNodeCount(), 'nodes');

    // Render all spouse edges
    for (const node of treeModel.getAllNodes()) {
      const partners = treeModel.getPartners(node.id);

      for (const partner of partners) {
        // Create unique key for this pair to avoid duplicates
        const pairKey = [node.id, partner.id].sort().join('-');

        if (!processedSpousePairs.has(pairKey)) {
          console.log(`  💑 Spouse edge: ${node.firstName} (${node.x.toFixed(0)},${node.y.toFixed(0)}) <-> ${partner.firstName} (${partner.x.toFixed(0)},${partner.y.toFixed(0)})`);
          const edge = this.renderSpouseEdge(node, partner);
          if (edge) {
            edges.push(edge);
          }
          processedSpousePairs.add(pairKey);
        }
      }
    }

    // Render all parent-child edges
    for (const node of treeModel.getAllNodes()) {
      const parents = treeModel.getParents(node.id);

      if (parents.length > 0) {
        const parentNames = parents.map(p => p.firstName).join(' & ');
        console.log(`  👶 Parent-child edge: ${parentNames} -> ${node.firstName} (child at ${node.x.toFixed(0)},${node.y.toFixed(0)})`);

        // Calculate parent cohort center (for potential future use)
        let parentCohortCenter;
        if (parents.length === 2) {
          parentCohortCenter = (parents[0].x + parents[1].x + parents[1].width) / 2;
        } else {
          parentCohortCenter = parents[0].x + parents[0].width / 2;
        }

        const edge = this.renderParentChildEdge(node, parents, parentCohortCenter);
        if (edge) {
          edges.push(edge);
        }
      }
    }

    console.log('✅ EdgeRenderer: Created', edges.length, 'edges');
    return edges;
  }
}

export default EdgeRenderer;
