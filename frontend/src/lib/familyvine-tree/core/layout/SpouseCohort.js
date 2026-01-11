/**
 * SpouseCohort - Groups spouse pairs for layout calculation
 * Walker's algorithm works on cohorts (spouse pairs) rather than individual nodes
 */

/**
 * SpouseCohort class - represents a married couple as a single layout unit
 */
export class SpouseCohort {
  constructor(partners = []) {
    /**
     * Partner nodes (1 or 2 people)
     * @type {Array<TreeNode>}
     */
    this.partners = partners;

    /**
     * Children cohorts
     * @type {Array<SpouseCohort>}
     */
    this.children = [];

    /**
     * Combined width of the cohort
     * @type {number}
     */
    this.width = 0;

    /**
     * Preliminary x position (Walker's algorithm)
     * @type {number}
     */
    this.prelim = 0;

    /**
     * Modifier value (Walker's algorithm)
     * @type {number}
     */
    this.mod = 0;

    /**
     * Thread node (Walker's algorithm)
     * @type {SpouseCohort|null}
     */
    this.thread = null;

    /**
     * Ancestor node (Walker's algorithm)
     * @type {SpouseCohort}
     */
    this.ancestor = this;

    /**
     * Parent cohort reference (for sibling lookups)
     * @type {SpouseCohort|null}
     */
    this.parent = null;

    /**
     * Change value (Walker's algorithm)
     * @type {number}
     */
    this.change = 0;

    /**
     * Shift value (Walker's algorithm)
     * @type {number}
     */
    this.shift = 0;

    /**
     * Final x position (center of cohort)
     * @type {number}
     */
    this.x = 0;

    /**
     * Final y position
     * @type {number}
     */
    this.y = 0;

    // Calculate initial width
    this.calculateWidth();
  }

  /**
   * Calculate the combined width of the cohort
   */
  calculateWidth() {
    const SPOUSE_GAP = 30;
    const NODE_WIDTH = 200;

    if (this.partners.length === 2) {
      // Two partners: width includes both nodes and gap
      this.width = (NODE_WIDTH * 2) + SPOUSE_GAP;
    } else if (this.partners.length === 1) {
      // Single person: just one node width
      this.width = NODE_WIDTH;
    } else {
      this.width = 0;
    }
  }

  /**
   * Get the primary parent (for children lookups)
   * @returns {TreeNode|null}
   */
  getPrimaryParent() {
    return this.partners.length > 0 ? this.partners[0] : null;
  }

  /**
   * Get the center X position of the cohort
   * @returns {number}
   */
  getCenterX() {
    return this.x;
  }

  /**
   * Check if this is a leaf cohort (no children)
   * @returns {boolean}
   */
  isLeaf() {
    return this.children.length === 0;
  }

  /**
   * Get leftmost child
   * @returns {SpouseCohort|null}
   */
  getLeftmostChild() {
    return this.children.length > 0 ? this.children[0] : null;
  }

  /**
   * Get rightmost child
   * @returns {SpouseCohort|null}
   */
  getRightmostChild() {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }

  /**
   * Get left sibling
   * @param {Array<SpouseCohort>} siblings - Array of all siblings
   * @returns {SpouseCohort|null}
   */
  getLeftSibling(siblings) {
    const index = siblings.indexOf(this);
    return index > 0 ? siblings[index - 1] : null;
  }
}

/**
 * Build cohorts from TreeModel
 * Groups spouse pairs together and builds parent-child relationships
 * @param {TreeModel} treeModel - The tree data model
 * @returns {Array<SpouseCohort>} Root cohorts (generation 1)
 */
export const buildCohorts = (treeModel) => {
  const cohortMap = new Map(); // Map<partnerId, SpouseCohort>
  const processedPairs = new Set(); // Track processed spouse pairs
  const rootCohorts = [];

  console.log('🔨 Building cohorts from', treeModel.getNodeCount(), 'nodes');

  // Get all nodes grouped by generation
  const maxGen = treeModel.getMaxGeneration();
  const generations = [];

  for (let gen = 1; gen <= maxGen; gen++) {
    generations.push(treeModel.getGeneration(gen));
  }

  // Process each generation to create cohorts
  generations.forEach((genNodes, genIndex) => {
    const genNum = genIndex + 1;

    genNodes.forEach((node) => {
      // Skip if already processed as part of a spouse pair
      if (cohortMap.has(node.id)) {
        return;
      }

      const partners = [node];
      const partnerIds = node.partnerIds || [];

      // Find partner in same generation
      if (partnerIds.length > 0) {
        const partnerId = partnerIds[0]; // Take first partner
        const partner = treeModel.getNode(partnerId);

        if (partner && partner.generation === node.generation) {
          const pairKey = [node.id, partnerId].sort().join('-');

          if (!processedPairs.has(pairKey)) {
            partners.push(partner);
            processedPairs.add(pairKey);
          }
        }
      }

      // Create cohort
      const cohort = new SpouseCohort(partners);

      // Map both partners to this cohort
      partners.forEach(p => {
        cohortMap.set(p.id, cohort);
      });

      // Track root cohorts
      if (genNum === 1) {
        rootCohorts.push(cohort);
      }
    });
  });

  // Build parent-child relationships between cohorts
  // Use a Set to avoid processing the same cohort multiple times
  const processedCohorts = new Set();

  for (const cohort of cohortMap.values()) {
    // Skip if we've already processed this cohort
    if (processedCohorts.has(cohort)) {
      continue;
    }
    processedCohorts.add(cohort);

    // Get children of ALL partners in this cohort (not just primary)
    const allChildren = new Map(); // Use Map to deduplicate by child ID

    for (const parent of cohort.partners) {
      const children = treeModel.getChildren(parent.id);
      for (const child of children) {
        if (!allChildren.has(child.id)) {
          allChildren.set(child.id, child);
        }
      }
    }

    // Group children into their own cohorts
    const childCohorts = [];
    const processedChildCohorts = new Set();

    for (const child of allChildren.values()) {
      const childCohort = cohortMap.get(child.id);

      if (childCohort && !processedChildCohorts.has(childCohort)) {
        childCohorts.push(childCohort);
        processedChildCohorts.add(childCohort);
        // Set parent reference for Walker's algorithm
        childCohort.parent = cohort;
      }
    }

    cohort.children = childCohorts;

    if (childCohorts.length > 0) {
      console.log(`  👨‍👩‍👧 ${cohort.partners.map(p => p.firstName).join(' & ')} -> children: ${childCohorts.map(c => c.partners.map(p => p.firstName).join('&')).join(', ')}`);
    }
  }

  // Debug: Log cohort statistics (use processedCohorts for accurate count)
  let cohortsWithParent = 0;
  let cohortsWithChildren = 0;
  for (const cohort of processedCohorts) {
    if (cohort.parent) cohortsWithParent++;
    if (cohort.children.length > 0) cohortsWithChildren++;
  }

  console.log('✅ Built', processedCohorts.size, 'unique cohorts,', rootCohorts.length, 'roots');
  console.log('   └─ With parent:', cohortsWithParent, ', With children:', cohortsWithChildren);

  return rootCohorts;
};

/**
 * Expand cohorts back to individual node positions
 * After layout calculation, this assigns x/y to each individual node
 * @param {Array<SpouseCohort>} cohorts - Root cohorts with calculated positions
 * @param {TreeModel} treeModel - Tree model to update
 */
export const expandCohorts = (cohorts, treeModel) => {
  const SPOUSE_GAP = 30;
  const NODE_WIDTH = 200;

  console.log('📐 Expanding cohorts to individual positions');

  // Recursive function to process cohort tree
  const processCohort = (cohort, depth = 0) => {
    const centerX = cohort.x;
    // Get Y from the first partner's node (set by calculateYPositions)
    const primaryPartner = cohort.partners[0];
    const y = primaryPartner ? primaryPartner.y : 0;

    const indent = '  '.repeat(depth);

    if (cohort.partners.length === 2) {
      // Two partners: position on either side of center
      const leftX = centerX - NODE_WIDTH - (SPOUSE_GAP / 2);
      const rightX = centerX + (SPOUSE_GAP / 2);

      console.log(`${indent}📍 Cohort (couple): ${cohort.partners[0].firstName} & ${cohort.partners[1].firstName} at centerX=${centerX.toFixed(0)}, y=${y}`);
      console.log(`${indent}   └─ ${cohort.partners[0].firstName}: (${leftX.toFixed(0)}, ${y})`);
      console.log(`${indent}   └─ ${cohort.partners[1].firstName}: (${rightX.toFixed(0)}, ${y})`);

      treeModel.updatePosition(cohort.partners[0].id, leftX, y);
      treeModel.updatePosition(cohort.partners[1].id, rightX, y);
    } else if (cohort.partners.length === 1) {
      // Single person: center on cohort center
      const x = centerX - (NODE_WIDTH / 2);
      console.log(`${indent}📍 Cohort (single): ${cohort.partners[0].firstName} at (${x.toFixed(0)}, ${y})`);
      treeModel.updatePosition(cohort.partners[0].id, x, y);
    }

    // Process children recursively
    if (cohort.children.length > 0) {
      console.log(`${indent}   Children: ${cohort.children.map(c => c.partners.map(p => p.firstName).join('&')).join(', ')}`);
    }
    cohort.children.forEach(childCohort => {
      processCohort(childCohort, depth + 1);
    });
  };

  cohorts.forEach(rootCohort => {
    processCohort(rootCohort);
  });

  // Debug: Log a few node positions
  const allNodes = treeModel.getAllNodes();
  console.log('📍 Sample node positions:', allNodes.slice(0, 5).map(n => ({
    id: n.id,
    name: n.firstName,
    x: n.x,
    y: n.y,
    gen: n.generation
  })));

  console.log('✅ Positions assigned to all nodes');
};

export default { SpouseCohort, buildCohorts, expandCohorts };
