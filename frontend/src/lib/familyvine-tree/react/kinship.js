/**
 * Kinship Calculator
 *
 * Computes the linguistic relationship between two family members
 * using the Lowest Common Ancestor (LCA) approach.
 *
 * Steps:
 *   1. BFS-climb ancestor distances for both persons
 *   2. Find LCA (common ancestor with minimum total distance)
 *   3. Map (up, down) generation distances to a human-readable title
 *   4. Return path for vine trace animation
 */

/**
 * Convert generation distances to a human-readable relationship title.
 *
 * @param {number} up   - Generations from reference person up to LCA
 * @param {number} down - Generations from target person up to LCA
 * @returns {string} Relationship title (e.g. "First Cousin Once Removed")
 */
export function getRelationshipTitle(up, down) {
  // Self
  if (up === 0 && down === 0) return 'Self';

  // Direct descendant (reference is ancestor of target)
  if (up === 0) {
    if (down === 1) return 'Child';
    if (down === 2) return 'Grandchild';
    return 'Great-'.repeat(down - 2) + 'Grandchild';
  }

  // Direct ancestor (target is ancestor of reference)
  if (down === 0) {
    if (up === 1) return 'Parent';
    if (up === 2) return 'Grandparent';
    return 'Great-'.repeat(up - 2) + 'Grandparent';
  }

  // Siblings
  if (up === 1 && down === 1) return 'Sibling';

  // Niece / Nephew (reference is the uncle/aunt)
  if (up === 1) {
    if (down === 2) return 'Niece/Nephew';
    return 'Great-'.repeat(down - 2) + 'Niece/Nephew';
  }

  // Uncle / Aunt (target is the uncle/aunt)
  if (down === 1) {
    if (up === 2) return 'Uncle/Aunt';
    return 'Great-'.repeat(up - 2) + 'Uncle/Aunt';
  }

  // Cousins
  const degree = Math.min(up, down) - 1;
  const removal = Math.abs(up - down);

  const ordinal = (n) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  };

  let title = `${ordinal(degree)} Cousin`;
  if (removal === 1) {
    title += ' Once Removed';
  } else if (removal === 2) {
    title += ' Twice Removed';
  } else if (removal > 2) {
    title += ` ${removal}x Removed`;
  }

  return title;
}

/**
 * BFS-climb from a starting node, collecting generation distances and paths to all ancestors.
 *
 * @param {Map} nodeMap  - Map<id, node> where nodes have fatherId/motherId
 * @param {*} startId    - Starting node ID
 * @returns {{ distances: Map, paths: Map }} distances and paths to ancestors
 */
function getAncestorDistancesAndPaths(nodeMap, startId) {
  const distances = new Map();
  const paths = new Map(); // Map<ancestorId, [path from start to ancestor]>
  const queue = [{ id: startId, dist: 0, path: [startId] }];

  while (queue.length > 0) {
    const { id, dist, path } = queue.shift();
    if (distances.has(id)) continue;
    distances.set(id, dist);
    paths.set(id, path);

    const node = nodeMap.get(id);
    if (!node) continue;

    if (node.fatherId && nodeMap.has(node.fatherId)) {
      queue.push({ id: node.fatherId, dist: dist + 1, path: [...path, node.fatherId] });
    }
    if (node.motherId && nodeMap.has(node.motherId)) {
      queue.push({ id: node.motherId, dist: dist + 1, path: [...path, node.motherId] });
    }
  }

  return { distances, paths };
}

/**
 * Legacy function for backwards compatibility
 */
function getAncestorDistances(nodeMap, startId) {
  return getAncestorDistancesAndPaths(nodeMap, startId).distances;
}

/**
 * Compute kinship between a reference person and a target person.
 *
 * @param {Map} nodeMap       - Map<id, node>
 * @param {*}   refId         - Reference person ID
 * @param {*}   targetId      - Target person ID
 * @param {boolean} includePath - Whether to include the path data
 * @returns {{ up: number, down: number, title: string, commonAncestorId?: *, pathFromRef?: Array, pathFromTarget?: Array } | null}
 */
export function computeKinship(nodeMap, refId, targetId, includePath = false) {
  if (refId === targetId) return { up: 0, down: 0, title: 'Self', commonAncestorId: refId, pathFromRef: [refId], pathFromTarget: [targetId] };

  const { distances: ancestorsRef, paths: pathsRef } = getAncestorDistancesAndPaths(nodeMap, refId);
  const { distances: ancestorsTarget, paths: pathsTarget } = getAncestorDistancesAndPaths(nodeMap, targetId);

  let bestUp = Infinity;
  let bestDown = Infinity;
  let bestTotal = Infinity;
  let bestAncestorId = null;

  for (const [id, distRef] of ancestorsRef) {
    if (ancestorsTarget.has(id)) {
      const distTarget = ancestorsTarget.get(id);
      const total = distRef + distTarget;
      if (total < bestTotal) {
        bestTotal = total;
        bestUp = distRef;
        bestDown = distTarget;
        bestAncestorId = id;
      }
    }
  }

  if (bestTotal === Infinity) return null; // No common ancestor

  const title = getRelationshipTitle(bestUp, bestDown);

  const result = { up: bestUp, down: bestDown, title, commonAncestorId: bestAncestorId };

  if (includePath) {
    result.pathFromRef = pathsRef.get(bestAncestorId) || [];
    result.pathFromTarget = pathsTarget.get(bestAncestorId) || [];
  }

  return result;
}

/**
 * Find the best (closest) kinship between any root person and the target.
 *
 * @param {Map}   nodeMap   - Map<id, node>
 * @param {Array} rootIds   - Array of generation-1 node IDs
 * @param {*}     targetId  - Target (hovered) person ID
 * @returns {{ title: string, rootName: string } | null}
 */
export function computeBestKinship(nodeMap, rootIds, targetId) {
  let best = null;
  let bestTotal = Infinity;
  let bestRootId = null;

  for (const rootId of rootIds) {
    const result = computeKinship(nodeMap, rootId, targetId);
    if (result && (result.up + result.down) < bestTotal) {
      bestTotal = result.up + result.down;
      best = result;
      bestRootId = rootId;
    }
  }

  if (!best) return null;

  const rootName = getRootNames(nodeMap, bestRootId);
  return { title: best.title, rootName };
}

/**
 * Build a display name for the root person, including their spouse if one exists.
 * e.g. "Alice and Philip Manning" or just "Alice Manning" if no spouse found.
 */
function getRootNames(nodeMap, rootId) {
  const rootNode = nodeMap.get(rootId);
  if (!rootNode) return '';

  const rootFirst = rootNode.firstName || '';
  const rootLast = rootNode.lastName || '';

  // Check for a spouse via partnerIds
  if (rootNode.partnerIds && rootNode.partnerIds.length > 0) {
    const spouse = nodeMap.get(rootNode.partnerIds[0]);
    if (spouse) {
      const spouseFirst = spouse.firstName || '';
      return `${rootFirst} and ${spouseFirst} ${rootLast}`.trim();
    }
  }

  return `${rootFirst} ${rootLast}`.trim();
}

/**
 * Check if two people are half-siblings (share exactly one parent)
 * @param {Map} nodeMap - Map<id, node>
 * @param {*} id1 - First person ID
 * @param {*} id2 - Second person ID
 * @returns {{ isHalf: boolean, sharedParentId: * | null }}
 */
export function checkHalfSibling(nodeMap, id1, id2) {
  const node1 = nodeMap.get(id1);
  const node2 = nodeMap.get(id2);

  if (!node1 || !node2) return { isHalf: false, sharedParentId: null };

  const sharedFather = node1.fatherId && node1.fatherId === node2.fatherId;
  const sharedMother = node1.motherId && node1.motherId === node2.motherId;

  if (sharedFather && sharedMother) {
    // Full siblings
    return { isHalf: false, sharedParentId: null };
  }

  if (sharedFather) {
    return { isHalf: true, sharedParentId: node1.fatherId };
  }

  if (sharedMother) {
    return { isHalf: true, sharedParentId: node1.motherId };
  }

  return { isHalf: false, sharedParentId: null };
}

/**
 * Get full kinship info including half-relative detection
 * @param {Map} nodeMap - Map<id, node>
 * @param {*} refId - Reference person ID
 * @param {*} targetId - Target person ID
 * @returns {Object} Full kinship result with paths and half-relative info
 */
export function getFullKinshipInfo(nodeMap, refId, targetId) {
  const result = computeKinship(nodeMap, refId, targetId, true);

  if (!result) return null;

  // Check for half-sibling relationship
  if (result.up === 1 && result.down === 1) {
    const halfCheck = checkHalfSibling(nodeMap, refId, targetId);
    if (halfCheck.isHalf) {
      result.title = 'Half-Sibling';
      result.isHalf = true;
      result.sharedParentId = halfCheck.sharedParentId;
    }
  }

  // Get names for display
  const refNode = nodeMap.get(refId);
  const targetNode = nodeMap.get(targetId);
  const commonNode = nodeMap.get(result.commonAncestorId);

  result.refName = refNode ? `${refNode.firstName} ${refNode.lastName}`.trim() : '';
  result.targetName = targetNode ? `${targetNode.firstName} ${targetNode.lastName}`.trim() : '';
  result.commonAncestorName = commonNode ? `${commonNode.firstName} ${commonNode.lastName}`.trim() : '';

  // Build the full connection path (ref -> ancestor -> target, reversed for target)
  const pathUp = result.pathFromRef || [];
  const pathDown = (result.pathFromTarget || []).slice(0, -1).reverse(); // Remove ancestor (already in pathUp) and reverse
  result.fullPath = [...pathUp, ...pathDown];

  return result;
}
