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
   * @returns {TreeModel} Tree with x/y positions set
   */
  calculate(treeModel) {
    console.log('🎯 WalkerLayout: Starting layout calculation');

    // Build spouse cohorts from tree model
    const rootCohorts = buildCohorts(treeModel);

    if (rootCohorts.length === 0) {
      console.warn('⚠️ No root cohorts found');
      return treeModel;
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

    // Calculate Y positions based on generation
    this.calculateYPositions(treeModel);

    // Expand cohorts back to individual node positions
    expandCohorts(rootCohorts, treeModel);

    console.log('✅ WalkerLayout: Layout complete');

    return treeModel;
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
   * This compares the right contour of left sibling's subtree with
   * the left contour of current cohort's subtree
   * @param {SpouseCohort} cohort - Current cohort
   */
  apportion(cohort) {
    const leftSibling = this.getLeftSibling(cohort);
    if (!leftSibling) return;

    // Start contour comparison from children level
    // insideLeft: right contour of left sibling's subtree
    // insideRight: left contour of current subtree
    let insideLeft = leftSibling.getRightmostChild();
    let insideRight = cohort.getLeftmostChild();

    if (!insideLeft || !insideRight) return;

    let outsideLeft = leftSibling.getLeftmostChild();
    let outsideRight = cohort.getRightmostChild();

    let sumInsideLeft = insideLeft.mod;
    let sumInsideRight = insideRight.mod;
    let sumOutsideLeft = outsideLeft ? outsideLeft.mod : 0;
    let sumOutsideRight = outsideRight ? outsideRight.mod : 0;

    // Walk down the contours comparing positions
    while (insideLeft && insideRight) {
      // Calculate overlap
      const leftPos = insideLeft.prelim + sumInsideLeft;
      const rightPos = insideRight.prelim + sumInsideRight;
      const separation = this.getSeparation(insideLeft, insideRight);
      const shift = leftPos - rightPos + separation;

      if (shift > 0) {
        // Shift the current subtree right
        cohort.prelim += shift;
        cohort.mod += shift;
        sumInsideRight += shift;
        sumOutsideRight += shift;
      }

      // Advance down the contours
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

    // Set up threads for ancestor handling
    if (insideLeft && outsideRight && !this.nextRight(outsideRight)) {
      outsideRight.thread = insideLeft;
      outsideRight.mod += sumInsideLeft - sumOutsideRight;
    }

    if (insideRight && outsideLeft && !this.nextLeft(outsideLeft)) {
      outsideLeft.thread = insideRight;
      outsideLeft.mod += sumInsideRight - sumOutsideLeft;
    }
  }

  /**
   * Get next left cohort in contour
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort|null}
   */
  nextLeft(cohort) {
    if (!cohort) return null;
    return cohort.children.length > 0 ? cohort.children[0] : cohort.thread;
  }

  /**
   * Get next right cohort in contour
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort|null}
   */
  nextRight(cohort) {
    if (!cohort) return null;
    return cohort.children.length > 0 ?
           cohort.children[cohort.children.length - 1] :
           cohort.thread;
  }

  /**
   * Move a subtree
   * @param {SpouseCohort} wl - Left subtree
   * @param {SpouseCohort} wr - Right subtree
   * @param {number} shift - Amount to shift
   */
  moveSubtree(wl, wr, shift) {
    const parent = this.getParent(wr);
    if (!parent) return;

    const subtrees = parent.children.length;
    const wlIndex = parent.children.indexOf(wl);
    const wrIndex = parent.children.indexOf(wr);

    if (wlIndex === -1 || wrIndex === -1) return;

    wr.change -= shift / (wrIndex - wlIndex);
    wr.shift += shift;
    wl.change += shift / (wrIndex - wlIndex);
    wr.prelim += shift;
    wr.mod += shift;
  }

  /**
   * Get ancestor
   * @param {SpouseCohort} vil - Cohort
   * @param {SpouseCohort} v - Reference cohort
   * @returns {SpouseCohort}
   */
  getAncestor(vil, v) {
    const parent = this.getParent(v);
    if (parent && parent.children.includes(vil.ancestor)) {
      return vil.ancestor;
    }
    return v;
  }

  /**
   * Get parent of a cohort
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort|null}
   */
  getParent(cohort) {
    // This is a simplified version - in full implementation,
    // we'd track parent references in SpouseCohort
    return cohort.parent || null;
  }

  /**
   * Get left sibling
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort|null}
   */
  getLeftSibling(cohort) {
    const parent = this.getParent(cohort);
    if (!parent) return null;

    const index = parent.children.indexOf(cohort);
    return index > 0 ? parent.children[index - 1] : null;
  }

  /**
   * Calculate separation between two cohorts
   * @param {SpouseCohort} left - Left cohort
   * @param {SpouseCohort} right - Right cohort
   * @returns {number} Separation distance
   */
  getSeparation(left, right) {
    return (left.width / 2) + (right.width / 2) + this.config.SIBLING_SPACING;
  }

  /**
   * Get total width of a subtree
   * @param {SpouseCohort} cohort
   * @returns {number} Subtree width
   */
  getSubtreeWidth(cohort) {
    if (cohort.children.length === 0) {
      return cohort.width;
    }

    const leftmost = this.getLeftmostDescendant(cohort);
    const rightmost = this.getRightmostDescendant(cohort);

    return rightmost.x - leftmost.x + rightmost.width;
  }

  /**
   * Get leftmost descendant
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort}
   */
  getLeftmostDescendant(cohort) {
    let current = cohort;
    while (current.children.length > 0) {
      current = current.children[0];
    }
    return current;
  }

  /**
   * Get rightmost descendant
   * @param {SpouseCohort} cohort
   * @returns {SpouseCohort}
   */
  getRightmostDescendant(cohort) {
    let current = cohort;
    while (current.children.length > 0) {
      current = current.children[current.children.length - 1];
    }
    return current;
  }

  /**
   * Calculate Y positions based on generation
   * @param {TreeModel} treeModel
   */
  calculateYPositions(treeModel) {
    const GENERATION_HEIGHT = this.config.GENERATION_HEIGHT;

    for (const node of treeModel.getAllNodes()) {
      node.y = node.generation * GENERATION_HEIGHT;
    }
  }
}

export default WalkerLayout;
