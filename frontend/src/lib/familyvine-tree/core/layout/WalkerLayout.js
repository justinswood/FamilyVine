/**
 * WalkerLayout - Implementation of Walker's tree layout algorithm
 * Adapted for family trees with spouse cohorts
 *
 * Reference: "Tidier Drawings of Trees" by John Q. Walker II (1990)
 * Modified to work with spouse pairs as single layout units
 */

import { buildCohorts, expandCohorts } from './SpouseCohort.js';
import LayoutConfig from './LayoutConfig.js';

export class WalkerLayout {
  constructor(config = {}) {
    /**
     * Layout configuration
     */
    this.config = {
      ...LayoutConfig,
      ...config
    };

    this.nodeNextPos = new Map();
  }

  /**
   * Main entry point - calculate layout for entire tree
   * @param {TreeModel} treeModel - Tree data model
   * @returns {{ treeModel: TreeModel, siblingGroups: Array }} Tree with positions and sibling group metadata
   */
  calculate(treeModel) {
    console.log('WalkerLayout: Starting layout calculation');

    // Build spouse cohorts from tree model
    const rootCohorts = buildCohorts(treeModel);

    if (rootCohorts.length === 0) {
      console.warn('No root cohorts found');
      return { treeModel, siblingGroups: [] };
    }

    // First walk: calculate preliminary positions
    rootCohorts.forEach(cohort => {
      this.firstWalk(cohort);
    });

    // Position root cohorts horizontally
    let offsetX = 0;
    const FAMILY_SPACING = this.config.WALKER.SUBTREE_SEPARATION;

    rootCohorts.forEach((cohort, index) => {
      if (index > 0) {
        offsetX += FAMILY_SPACING;
      }

      // Second walk: finalize positions
      this.secondWalk(cohort, 0, offsetX);

      // Update offset for next root
      offsetX += this.getSubtreeWidth(cohort);
    });

    // Bottom-up compaction: remove excess whitespace between subtrees
    this.compactSubtrees(rootCohorts);

    // Calculate initial Y positions based on generation (fixed spacing)
    this.calculateYPositions(treeModel);

    // Expand cohorts back to individual node positions
    expandCohorts(rootCohorts, treeModel);

    // Post-process: split large sibling groups into 2-column grids
    // (disabled when SIBLING_SPLIT_THRESHOLD is high)
    const siblingGroups = this.applyTwoColumnSplit(treeModel, rootCohorts);

    // Resolve vertical collisions caused by multi-row grids
    this.resolveVerticalCollisions(treeModel);

    // Resolve horizontal collisions on final node positions (safety net)
    this.resolveHorizontalCollisions(treeModel);

    // Normalize generation Y: enforce strict horizontal lanes
    // All nodes in each generation must share the exact same Y
    this.normalizeGenerationY(treeModel);

    // Recompute sibling group bounds after Y adjustments
    this.updateSiblingGroupBounds(treeModel, siblingGroups);

    console.log('WalkerLayout: Layout complete,', siblingGroups.length, 'sibling groups split');

    return { treeModel, siblingGroups };
  }

  /**
   * Resolve vertical collisions by computing the actual max bottom edge
   * of each generation and shifting subsequent generations down as needed.
   *
   * Formula: Y(gen_n) = Y(gen_{n-1}) + MaxHeight(gen_{n-1}) + GENERATION_GAP
   *
   * @param {TreeModel} treeModel - Tree model with final positions
   */
  resolveVerticalCollisions(treeModel) {
    const GENERATION_GAP = this.config.GENERATION_GAP || 60;
    const maxGen = treeModel.getMaxGeneration();

    if (maxGen <= 1) return;

    // Group nodes by generation
    const genNodes = new Map();
    for (const node of treeModel.getAllNodes()) {
      if (!genNodes.has(node.generation)) {
        genNodes.set(node.generation, []);
      }
      genNodes.get(node.generation).push(node);
    }

    // Walk generations top-down, shifting each one below the previous
    for (let gen = 2; gen <= maxGen; gen++) {
      const prevNodes = genNodes.get(gen - 1);
      const currNodes = genNodes.get(gen);

      if (!prevNodes || prevNodes.length === 0 || !currNodes || currNodes.length === 0) {
        continue;
      }

      // Max bottom edge of previous generation (accounts for multi-row grids)
      const prevMaxBottom = Math.max(...prevNodes.map(n => n.y + n.height));

      // Current top edge of this generation
      const currMinTop = Math.min(...currNodes.map(n => n.y));

      // Required Y for this generation
      const requiredY = prevMaxBottom + GENERATION_GAP;

      if (currMinTop < requiredY) {
        // Shift this generation and all below it
        const shift = requiredY - currMinTop;

        for (let shiftGen = gen; shiftGen <= maxGen; shiftGen++) {
          const nodesToShift = genNodes.get(shiftGen);
          if (nodesToShift) {
            for (const node of nodesToShift) {
              node.y += shift;
            }
          }
        }
      }
    }
  }

  /**
   * Normalize generation Y positions to enforce strict horizontal lanes.
   * After collision resolution, some nodes within the same generation may
   * have slightly different Y values. This snaps every node in each
   * generation to the minimum Y found in that generation.
   *
   * @param {TreeModel} treeModel - Tree model with final positions
   */
  normalizeGenerationY(treeModel) {
    const maxGen = treeModel.getMaxGeneration();
    const genNodes = new Map();

    for (const node of treeModel.getAllNodes()) {
      if (!genNodes.has(node.generation)) {
        genNodes.set(node.generation, []);
      }
      genNodes.get(node.generation).push(node);
    }

    for (let gen = 1; gen <= maxGen; gen++) {
      const nodes = genNodes.get(gen);
      if (!nodes || nodes.length === 0) continue;

      // All nodes in this generation snap to the same Y (the minimum)
      const targetY = Math.min(...nodes.map(n => n.y));
      for (const node of nodes) {
        node.y = targetY;
      }
    }
  }

  /**
   * Recompute sibling group bounds after vertical collision resolution.
   * The split assigned bounds before Y shifts, so they may be stale.
   *
   * @param {TreeModel} treeModel - Tree model with final positions
   * @param {Array<Object>} siblingGroups - Sibling group metadata
   */
  updateSiblingGroupBounds(treeModel, siblingGroups) {
    const NODE_WIDTH = this.config.NODE_WIDTH;

    for (const group of siblingGroups) {
      const childNodes = group.childNodeIds
        .map(id => treeModel.getNode(id))
        .filter(Boolean);

      if (childNodes.length === 0) continue;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of childNodes) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
      }

      group.bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };
    }
  }

  /**
   * Post-processing: rearrange large sibling groups into 2-column grids
   * Runs after Walker layout has assigned positions to all nodes.
   * @param {TreeModel} treeModel - Tree model with positions
   * @param {Array<SpouseCohort>} rootCohorts - Root cohort tree
   * @returns {Array<Object>} Sibling group metadata for ghost containers
   */
  applyTwoColumnSplit(treeModel, rootCohorts) {
    const siblingGroups = [];
    const threshold = this.config.SIBLING_SPLIT_THRESHOLD || 4;
    const NODE_WIDTH = this.config.NODE_WIDTH;
    const NODE_HEIGHT = this.config.NODE_HEIGHT;
    const COL_GAP = this.config.TWO_COL_GAP || 16;
    const ROW_GAP = this.config.TWO_COL_ROW_GAP || 24;

    const processCohort = (cohort) => {
      // Check if this cohort has enough children to split
      if (cohort.children.length > threshold) {
        // Collect all child nodes from the child cohorts
        const childNodes = [];
        for (const childCohort of cohort.children) {
          for (const partner of childCohort.partners) {
            const node = treeModel.getNode(partner.id);
            if (node) childNodes.push(node);
          }
        }

        if (childNodes.length > threshold) {
          // Calculate 2-column grid layout
          const rows = Math.ceil(childNodes.length / 2);
          const leftCol = childNodes.slice(0, rows);
          const rightCol = childNodes.slice(rows);

          // Find the parent center to align the grid
          const parentNodes = cohort.partners.map(p => treeModel.getNode(p.id)).filter(Boolean);
          let parentCenterX;
          if (parentNodes.length === 2) {
            parentCenterX = (parentNodes[0].x + parentNodes[0].width / 2 + parentNodes[1].x + parentNodes[1].width / 2) / 2;
          } else if (parentNodes.length === 1) {
            parentCenterX = parentNodes[0].x + parentNodes[0].width / 2;
          } else {
            parentCenterX = childNodes[0].x + NODE_WIDTH / 2;
          }

          const totalGridWidth = NODE_WIDTH * 2 + COL_GAP;
          const gridLeftX = parentCenterX - totalGridWidth / 2;
          const startY = childNodes[0].y; // Same generation Y

          // Assign grid positions
          for (let row = 0; row < rows; row++) {
            const y = startY + row * (NODE_HEIGHT + ROW_GAP);

            if (leftCol[row]) {
              treeModel.updatePosition(leftCol[row].id, gridLeftX, y);
            }
            if (rightCol[row]) {
              treeModel.updatePosition(rightCol[row].id, gridLeftX + NODE_WIDTH + COL_GAP, y);
            }
          }

          // Calculate bounding box for ghost container
          const gridHeight = rows * NODE_HEIGHT + (rows - 1) * ROW_GAP;

          siblingGroups.push({
            id: `group-${cohort.partners[0]?.id || 'unknown'}`,
            parentIds: cohort.partners.map(p => p.id),
            childNodeIds: childNodes.map(n => n.id),
            bounds: {
              x: gridLeftX,
              y: startY,
              width: totalGridWidth,
              height: gridHeight,
            },
          });
        }
      }

      // Recurse into children
      for (const child of cohort.children) {
        processCohort(child);
      }
    };

    rootCohorts.forEach(processCohort);

    return siblingGroups;
  }

  /**
   * First walk (post-order traversal)
   * Calculate preliminary x positions and modifiers
   * @param {SpouseCohort} cohort - Current cohort
   * @param {number} depth - Current depth (for debugging)
   */
  firstWalk(cohort, depth = 0) {
    if (cohort.isLeaf()) {
      // Leaf node: check for left sibling
      const leftSibling = this.getLeftSibling(cohort);

      if (leftSibling) {
        cohort.prelim = leftSibling.prelim + this.getSeparation(leftSibling, cohort);
      } else {
        cohort.prelim = 0;
      }
    } else {
      // Interior node: process children first
      cohort.children.forEach(child => {
        this.firstWalk(child, depth + 1);
      });

      // Position cohort centered over children
      const leftChild = cohort.getLeftmostChild();
      const rightChild = cohort.getRightmostChild();
      const midpoint = (leftChild.prelim + rightChild.prelim) / 2;

      const leftSibling = this.getLeftSibling(cohort);

      if (leftSibling) {
        cohort.prelim = leftSibling.prelim + this.getSeparation(leftSibling, cohort);
        cohort.mod = cohort.prelim - midpoint;
        this.apportion(cohort);
      } else {
        cohort.prelim = midpoint;
      }
    }
  }

  /**
   * Second walk (pre-order traversal)
   * Finalize x positions by adding accumulated modifiers
   * @param {SpouseCohort} cohort - Current cohort
   * @param {number} modSum - Accumulated modifier sum
   * @param {number} offset - X offset for this subtree
   */
  secondWalk(cohort, modSum, offset = 0) {
    cohort.x = cohort.prelim + modSum + offset;

    // Process children
    cohort.children.forEach(child => {
      this.secondWalk(child, modSum + cohort.mod, offset);
    });
  }

  /**
   * Apportion - shift subtrees to prevent overlaps
   * @param {SpouseCohort} cohort - Current cohort
   */
  apportion(cohort) {
    const leftSibling = this.getLeftSibling(cohort);
    if (!leftSibling) return;

    let insideLeft = leftSibling.getRightmostChild();
    let insideRight = cohort.getLeftmostChild();

    if (!insideLeft || !insideRight) return;

    let outsideLeft = leftSibling.getLeftmostChild();
    let outsideRight = cohort.getRightmostChild();

    let sumInsideLeft = insideLeft.mod;
    let sumInsideRight = insideRight.mod;
    let sumOutsideLeft = outsideLeft ? outsideLeft.mod : 0;
    let sumOutsideRight = outsideRight ? outsideRight.mod : 0;

    while (insideLeft && insideRight) {
      const leftPos = insideLeft.prelim + sumInsideLeft;
      const rightPos = insideRight.prelim + sumInsideRight;
      const separation = this.getSeparation(insideLeft, insideRight);
      const shift = leftPos - rightPos + separation;

      if (shift > 0) {
        cohort.prelim += shift;
        cohort.mod += shift;
        sumInsideRight += shift;
        sumOutsideRight += shift;
      }

      insideLeft = this.nextRight(insideLeft);
      insideRight = this.nextLeft(insideRight);

      if (outsideLeft) {
        sumOutsideLeft += outsideLeft.mod;
        outsideLeft = this.nextLeft(outsideLeft);
      }
      if (outsideRight) {
        sumOutsideRight += outsideRight.mod;
        outsideRight = this.nextRight(outsideRight);
      }

      if (insideLeft) sumInsideLeft += insideLeft.mod;
      if (insideRight) sumInsideRight += insideRight.mod;
    }

    if (insideLeft && outsideRight && !this.nextRight(outsideRight)) {
      outsideRight.thread = insideLeft;
      outsideRight.mod += sumInsideLeft - sumOutsideRight;
    }

    if (insideRight && outsideLeft && !this.nextLeft(outsideLeft)) {
      outsideLeft.thread = insideRight;
      outsideLeft.mod += sumInsideRight - sumOutsideLeft;
    }
  }

  nextLeft(cohort) {
    if (!cohort) return null;
    return cohort.children.length > 0 ? cohort.children[0] : cohort.thread;
  }

  nextRight(cohort) {
    if (!cohort) return null;
    return cohort.children.length > 0 ?
           cohort.children[cohort.children.length - 1] :
           cohort.thread;
  }

  moveSubtree(wl, wr, shift) {
    const parent = this.getParent(wr);
    if (!parent) return;

    const wlIndex = parent.children.indexOf(wl);
    const wrIndex = parent.children.indexOf(wr);

    if (wlIndex === -1 || wrIndex === -1) return;

    wr.change -= shift / (wrIndex - wlIndex);
    wr.shift += shift;
    wl.change += shift / (wrIndex - wlIndex);
    wr.prelim += shift;
    wr.mod += shift;
  }

  getAncestor(vil, v) {
    const parent = this.getParent(v);
    if (parent && parent.children.includes(vil.ancestor)) {
      return vil.ancestor;
    }
    return v;
  }

  getParent(cohort) {
    return cohort.parent || null;
  }

  getLeftSibling(cohort) {
    const parent = this.getParent(cohort);
    if (!parent) return null;

    const index = parent.children.indexOf(cohort);
    return index > 0 ? parent.children[index - 1] : null;
  }

  getSeparation(left, right) {
    const leftIsLeaf = left.isLeaf();
    const rightIsLeaf = right.isLeaf();

    let gap;
    if (leftIsLeaf && rightIsLeaf) {
      gap = this.config.LEAF_SIBLING_SPACING || 16;
    } else if (!leftIsLeaf && !rightIsLeaf) {
      gap = this.config.BRANCH_SIBLING_SPACING || 48;
    } else {
      gap = this.config.SIBLING_SPACING || 28;
    }

    return (left.width / 2) + (right.width / 2) + gap;
  }

  getSubtreeWidth(cohort) {
    if (cohort.children.length === 0) {
      return cohort.width;
    }

    const leftmost = this.getLeftmostDescendant(cohort);
    const rightmost = this.getRightmostDescendant(cohort);

    return rightmost.x - leftmost.x + rightmost.width;
  }

  getLeftmostDescendant(cohort) {
    let current = cohort;
    while (current.children.length > 0) {
      current = current.children[0];
    }
    return current;
  }

  getRightmostDescendant(cohort) {
    let current = cohort;
    while (current.children.length > 0) {
      current = current.children[current.children.length - 1];
    }
    return current;
  }

  /**
   * Bottom-up subtree compaction with contour-based collision detection.
   *
   * Instead of simple bounding boxes (which miss level-specific overlaps),
   * this builds left/right contours at every depth level and uses the
   * tightest gap across all shared levels to determine the shift.
   *
   * Handles both excess whitespace (compacts) AND overlaps (pushes apart).
   *
   * @param {Array<SpouseCohort>} rootCohorts - Root cohort trees
   */
  compactSubtrees(rootCohorts) {
    const LEAF_GAP = this.config.LEAF_SIBLING_SPACING || 20;
    const BRANCH_GAP = this.config.BRANCH_SIBLING_SPACING || 40;
    const SUBTREE_GAP = this.config.SUBTREE_SEPARATION || 40;

    /**
     * Build left or right contour of a subtree.
     * Returns Map<relativeDepth, edgeX> for the outermost edge at each depth.
     */
    const buildContour = (cohort, side, depth = 0) => {
      const contour = new Map();

      const walk = (node, d) => {
        const edge = side === 'right'
          ? node.x + node.width / 2
          : node.x - node.width / 2;

        if (!contour.has(d)) {
          contour.set(d, edge);
        } else {
          const current = contour.get(d);
          if ((side === 'right' && edge > current) ||
              (side === 'left' && edge < current)) {
            contour.set(d, edge);
          }
        }

        for (const child of node.children) {
          walk(child, d + 1);
        }
      };

      walk(cohort, depth);
      return contour;
    };

    /**
     * Compute minimum gap between two adjacent subtrees across all shared
     * depth levels. A negative value indicates overlap.
     */
    const getMinContourGap = (leftCohort, rightCohort) => {
      const rightContour = buildContour(leftCohort, 'right');
      const leftContour = buildContour(rightCohort, 'left');

      let minGap = Infinity;
      for (const [depth, rightEdge] of rightContour) {
        if (leftContour.has(depth)) {
          const gap = leftContour.get(depth) - rightEdge;
          if (gap < minGap) minGap = gap;
        }
      }

      return minGap === Infinity ? 0 : minGap;
    };

    /**
     * Shift an entire subtree horizontally by dx.
     */
    const shiftSubtree = (cohort, dx) => {
      cohort.x += dx;
      for (const child of cohort.children) {
        shiftSubtree(child, dx);
      }
    };

    /**
     * Build cumulative right contour from multiple sibling subtrees.
     * Takes the rightmost edge at each depth across all given cohorts.
     */
    const buildCumulativeRightContour = (children) => {
      const cumulative = new Map();
      for (const child of children) {
        const right = buildContour(child, 'right');
        for (const [depth, edge] of right) {
          if (!cumulative.has(depth) || edge > cumulative.get(depth)) {
            cumulative.set(depth, edge);
          }
        }
      }
      return cumulative;
    };

    /**
     * Bottom-up compaction with cumulative contour-based gap enforcement.
     * Uses cumulative right contours so that when a leaf sibling sits
     * between two branch siblings, the deeper descendants from earlier
     * branches are checked against later branches (prevents interleaving).
     */
    const compact = (cohort) => {
      // Recurse: compact children first so their contours are tight
      for (const child of cohort.children) {
        compact(child);
      }

      if (cohort.children.length <= 1) return;

      // Enforce desired gap using cumulative right contour of all
      // previously-placed siblings (not just the immediate left neighbor)
      for (let i = 1; i < cohort.children.length; i++) {
        const rightChild = cohort.children[i];

        // Cumulative right contour of children[0..i-1]
        const cumulativeRight = buildCumulativeRightContour(
          cohort.children.slice(0, i)
        );

        // Left contour of the child being placed
        const leftOfRight = buildContour(rightChild, 'left');

        // Find minimum gap across ALL shared depth levels
        let minGap = Infinity;
        for (const [depth, rightEdge] of cumulativeRight) {
          if (leftOfRight.has(depth)) {
            const gap = leftOfRight.get(depth) - rightEdge;
            if (gap < minGap) minGap = gap;
          }
        }
        if (minGap === Infinity) minGap = 0;

        const leftChild = cohort.children[i - 1];
        const desiredGap = (leftChild.isLeaf() && rightChild.isLeaf())
          ? LEAF_GAP : BRANCH_GAP;

        // Shift to enforce exactly desiredGap (compacts OR resolves overlap)
        const needed = desiredGap - minGap;
        if (Math.abs(needed) > 0.5) {
          for (let j = i; j < cohort.children.length; j++) {
            shiftSubtree(cohort.children[j], needed);
          }
        }
      }

      // Re-center parent over its (now correctly spaced) children
      const firstChild = cohort.children[0];
      const lastChild = cohort.children[cohort.children.length - 1];
      cohort.x = (firstChild.x + lastChild.x) / 2;
    };

    // Compact within each root family
    for (const root of rootCohorts) {
      compact(root);
    }

    // Compact root families against each other (also using cumulative contours)
    if (rootCohorts.length > 1) {
      for (let i = 1; i < rootCohorts.length; i++) {
        const cumulativeRight = buildCumulativeRightContour(
          rootCohorts.slice(0, i)
        );
        const leftOfRight = buildContour(rootCohorts[i], 'left');

        let minGap = Infinity;
        for (const [depth, rightEdge] of cumulativeRight) {
          if (leftOfRight.has(depth)) {
            const gap = leftOfRight.get(depth) - rightEdge;
            if (gap < minGap) minGap = gap;
          }
        }
        if (minGap === Infinity) minGap = 0;

        const needed = SUBTREE_GAP - minGap;
        if (Math.abs(needed) > 0.5) {
          for (let j = i; j < rootCohorts.length; j++) {
            shiftSubtree(rootCohorts[j], needed);
          }
        }
      }
    }
  }

  /**
   * Safety-net pass on final expanded node positions.
   * Sorts every generation by X, then pushes any overlapping node (and all
   * nodes to its right at that generation) to the right until a minimum
   * gutter is satisfied. Also cascades the shift to descendants.
   *
   * @param {TreeModel} treeModel - Tree model with final positions
   */
  resolveHorizontalCollisions(treeModel) {
    const MIN_GUTTER = this.config.LEAF_SIBLING_SPACING || 20;
    const maxGen = treeModel.getMaxGeneration();

    for (let gen = 1; gen <= maxGen; gen++) {
      const nodes = treeModel.getGeneration(gen)
        .slice()
        .sort((a, b) => a.x - b.x);

      for (let i = 1; i < nodes.length; i++) {
        const prevRightEdge = nodes[i - 1].x + nodes[i - 1].width;
        const currLeftEdge = nodes[i].x;
        const gap = currLeftEdge - prevRightEdge;

        if (gap < MIN_GUTTER) {
          const shift = MIN_GUTTER - gap;
          // Shift this node and every node to its right at this generation
          for (let j = i; j < nodes.length; j++) {
            nodes[j].x += shift;
          }
        }
      }
    }
  }

  calculateYPositions(treeModel) {
    const GENERATION_HEIGHT = this.config.GENERATION_HEIGHT;

    for (const node of treeModel.getAllNodes()) {
      node.y = node.generation * GENERATION_HEIGHT;
    }
  }
}

export default WalkerLayout;
