/**
 * useAncestralPath - Manages ancestral path highlighting for FamilyVine.
 *
 * On hover of any person, climbs the tree through fatherId/motherId
 * to collect every ancestor back to the root generation.
 *
 * Returns a Set of node IDs that are on the active path so that
 * cards and connector lines can apply glow styling.
 */

import { useState, useCallback, useMemo } from 'react';

export function useAncestralPath(nodes) {
  const [hoveredId, setHoveredId] = useState(null);

  // Build id → node lookup
  const nodeMap = useMemo(() => {
    const map = new Map();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // BFS climb: collect hovered person + all ancestors
  const activePath = useMemo(() => {
    if (!hoveredId) return new Set();

    const path = new Set();
    const queue = [hoveredId];

    while (queue.length > 0) {
      const id = queue.shift();
      if (path.has(id)) continue;
      path.add(id);

      const node = nodeMap.get(id);
      if (!node) continue;

      if (node.fatherId && nodeMap.has(node.fatherId)) {
        queue.push(node.fatherId);
      }
      if (node.motherId && nodeMap.has(node.motherId)) {
        queue.push(node.motherId);
      }
    }

    return path;
  }, [hoveredId, nodeMap]);

  const setHoveredPerson = useCallback((person) => {
    setHoveredId(person ? person.id : null);
  }, []);

  return { activePath, setHoveredPerson, hoveredId };
}

export default useAncestralPath;
