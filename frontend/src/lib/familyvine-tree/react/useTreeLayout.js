/**
 * useTreeLayout - Custom hook for computing tree layout
 * Transforms backend data into positioned nodes, edges, and sibling groups.
 */

import { useMemo } from 'react';
import { transformGenerationsData } from '../core/data/DataTransformer.js';
import { WalkerLayout } from '../core/layout/WalkerLayout.js';
import LayoutConfig from '../core/layout/LayoutConfig.js';

/**
 * Build a map from sorted partner-pair key → union data (id + divorceDate).
 * Read directly from the raw generations API response.
 */
function buildSpouseUnionMap(generationsData) {
  const map = new Map();
  for (const gen of generationsData) {
    for (const union of gen.unions) {
      const p1 = union.partner1?.id;
      const p2 = union.partner2?.id;
      if (p1 && p2) {
        const key = [p1, p2].sort().join('-');
        map.set(key, {
          id: union.id,
          unionType: union.union_type || null,
          divorceDate: union.divorce_date || null,
        });
      }
    }
  }
  return map;
}

/**
 * Compute family connectors from the positioned TreeModel.
 * Produces orthogonal connector data (stem → bus → drops) per union.
 *
 * Connector types:
 * - family: union center-bottom → vertical stem → horizontal bus → vertical drops to children
 * - single-parent: single parent bottom → orthogonal path to child
 *
 * Path geometry (90-degree "elbow" connectors):
 *   1. Stem: vertical line from center-bottom of union to the midpoint of the gap
 *   2. Bus: horizontal line spanning from leftmost child to rightmost child
 *   3. Drops: vertical lines from bus down into top-center of each child
 */
function computeFamilyConnectors(treeModel) {
  const connectors = [];
  const processedPairs = new Set();
  const connectedChildIds = new Set();

  // Pass 1: couple → children connectors
  for (const node of treeModel.getAllNodes()) {
    const partners = treeModel.getPartners(node.id);
    for (const partner of partners) {
      const pairKey = [node.id, partner.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const unionPartnerIds = new Set([node.id, partner.id]);

      // Find children that belong to this specific union
      const sharedChildren = [];
      for (const child of treeModel.getAllNodes()) {
        if (child.generation <= node.generation) continue;
        const bothMatch = unionPartnerIds.has(child.fatherId) && unionPartnerIds.has(child.motherId);
        const singleMatch = (!child.fatherId || !child.motherId) &&
                            (unionPartnerIds.has(child.fatherId) || unionPartnerIds.has(child.motherId));
        if (bothMatch || singleMatch) {
          sharedChildren.push(child);
        }
      }

      if (sharedChildren.length === 0) continue;

      sharedChildren.forEach(c => connectedChildIds.add(c.id));

      // Union center-bottom
      const leftNode = node.x < partner.x ? node : partner;
      const rightNode = node.x < partner.x ? partner : node;
      const unionCenterX = (leftNode.x + leftNode.width / 2 + rightNode.x + rightNode.width / 2) / 2;
      const unionBottomY = Math.max(leftNode.y + leftNode.height, rightNode.y + rightNode.height);

      // Children top-center positions, sorted by X
      const childPositions = sharedChildren
        .map(c => ({ id: c.id, x: c.x + c.width / 2, y: c.y }))
        .sort((a, b) => a.x - b.x);

      connectors.push({
        id: `family-${pairKey}`,
        type: 'family',
        unionX: unionCenterX,
        unionY: unionBottomY,
        children: childPositions,
      });
    }
  }

  // Pass 2: single-parent connectors (children not connected via a couple)
  for (const node of treeModel.getAllNodes()) {
    if (connectedChildIds.has(node.id)) continue;

    const parents = treeModel.getParents(node.id);
    if (parents.length === 0) continue;

    const parent = parents[0];
    connectors.push({
      id: `single-${node.id}`,
      type: 'single-parent',
      unionX: parent.x + parent.width / 2,
      unionY: parent.y + parent.height,
      children: [{ id: node.id, x: node.x + node.width / 2, y: node.y }],
    });
  }

  return connectors;
}

/**
 * Compute union units from positioned tree.
 * Groups partner pairs into single layout entities for rendering.
 * Each node can only be in one union unit (first partner wins).
 *
 * @param {TreeModel} treeModel - Tree with final positions
 * @param {Map} spouseUnionMap - Map from sorted pair key → union ID
 * @returns {{ unionUnits: Array, unitMemberIds: Set }}
 */
function computeUnionUnits(treeModel, spouseUnionMap) {
  const units = [];
  const unitMemberIds = new Set();
  const processedPairs = new Set();

  for (const node of treeModel.getAllNodes()) {
    // Skip if already part of a union unit
    if (unitMemberIds.has(node.id)) continue;

    const partners = treeModel.getPartners(node.id);
    for (const partner of partners) {
      // Skip if partner already claimed by another unit
      if (unitMemberIds.has(partner.id)) continue;

      const pairKey = [node.id, partner.id].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const leftNode = node.x <= partner.x ? node : partner;
      const rightNode = node.x <= partner.x ? partner : node;

      const unionData = spouseUnionMap.get(pairKey) || null;
      const unionId = unionData?.id || null;
      const unionType = unionData?.unionType || null;
      const divorceDate = unionData?.divorceDate || null;

      units.push({
        id: `union-${pairKey}`,
        unionId,
        unionType,
        divorceDate,
        partners: [leftNode, rightNode],
        x: leftNode.x,
        y: Math.min(leftNode.y, rightNode.y),
        width: rightNode.x + rightNode.width - leftNode.x,
        height: Math.max(leftNode.height, rightNode.height),
      });

      unitMemberIds.add(node.id);
      unitMemberIds.add(partner.id);
      break; // Only one union unit per node
    }
  }

  return { unionUnits: units, unitMemberIds };
}

/**
 * Compute bounding box from positioned nodes.
 */
function computeBounds(nodes) {
  if (nodes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Hook: transform generations data through the full layout pipeline.
 * @param {Array} generationsData - Backend API response
 * @param {string} apiUrl - Base API URL for images
 * @param {number} maxGenerations - Max generation depth
 * @param {Object} config - Optional layout config overrides
 * @returns {{ nodes, edges, siblingGroups, bounds, treeModel }}
 */
export function useTreeLayout(generationsData, apiUrl, maxGenerations, config) {
  return useMemo(() => {
    if (!generationsData || generationsData.length === 0) {
      return { nodes: [], edges: [], siblingGroups: [], bounds: null, treeModel: null };
    }

    try {
      // 0. Build spouse → union ID map from raw data
      const spouseUnionMap = buildSpouseUnionMap(generationsData);

      // 1. Transform API data to TreeModel
      const treeModel = transformGenerationsData(generationsData, apiUrl);

      // 2. Run Walker layout (returns treeModel + siblingGroups)
      const layout = new WalkerLayout({ ...LayoutConfig, ...config });
      const { siblingGroups } = layout.calculate(treeModel);

      // 3. Extract positioned nodes
      const nodes = treeModel.getAllNodes();

      // 4. Compute family connectors (orthogonal stem+bus+drops)
      const edges = computeFamilyConnectors(treeModel);

      // 5. Compute union units (couples grouped for rendering)
      const { unionUnits, unitMemberIds } = computeUnionUnits(treeModel, spouseUnionMap);
      const singleNodes = nodes.filter(n => !unitMemberIds.has(n.id));

      // 6. Compute bounds
      const bounds = computeBounds(nodes);

      return { nodes, edges, siblingGroups, bounds, treeModel, unionUnits, singleNodes, unitMemberIds };
    } catch (err) {
      console.error('useTreeLayout error:', err);
      return { nodes: [], edges: [], siblingGroups: [], bounds: null, treeModel: null };
    }
  }, [generationsData, apiUrl, maxGenerations, config]);
}

export default useTreeLayout;
