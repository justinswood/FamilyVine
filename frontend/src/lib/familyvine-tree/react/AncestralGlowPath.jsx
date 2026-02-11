/**
 * AncestralGlowPath - Renders a single, unbroken SVG path from the hovered
 * person up through their ancestral bloodline to the root.
 *
 * Uses ONE <path> element with continuous M/V/H commands so there are
 * no "joint" gaps between generation connectors.
 *
 * For every generational jump the path follows strict V-H-V geometry
 * that overlaps the tree's real Stem-Bus-Drop connectors:
 *   V  up from child to the horizontal bus
 *   H  along the bus to align with the blood-parent's card center
 *   V  up to the blood-parent's card center
 *
 * The bloodline chain is pre-computed by FamilyTreeView with blood-relative
 * preference logic (prefers parent who has their own parents in the tree
 * over a married-in spouse), ensuring the glow always anchors to the
 * correct blood ancestor.
 *
 * Rendered in its own SVG layer above the base connectors with
 * pointer-events: none to avoid stealing mouse hovers.
 */

import React, { memo, useMemo } from 'react';

const AncestralGlowPath = memo(({ bloodlineChain, nodes, edges }) => {
  const glowD = useMemo(() => {
    if (!bloodlineChain || bloodlineChain.length < 2) return '';
    if (!edges || edges.length === 0 || !nodes || nodes.length === 0) return '';

    // Build id → node lookup
    const nodeMap = new Map();
    for (const node of nodes) {
      nodeMap.set(node.id, node);
    }

    // Build childId → { edge, child } lookup
    // Each child appears in exactly one edge (their parents' union connector).
    // child.x = card center-x, child.y = card top-y
    const childToEdge = new Map();
    for (const edge of edges) {
      for (const child of (edge.children || [])) {
        childToEdge.set(child.id, { edge, child });
      }
    }

    // ── Start at the hovered person's top-center ──
    const startEntry = childToEdge.get(bloodlineChain[0]);
    if (!startEntry) return ''; // hovered person not a child in any edge
    let d = `M ${startEntry.child.x} ${startEntry.child.y}`;

    // ── Strict V-H-V for every generational jump ──
    for (let i = 0; i < bloodlineChain.length - 1; i++) {
      const childId = bloodlineChain[i];
      const parentId = bloodlineChain[i + 1];

      const parentNode = nodeMap.get(parentId);
      if (!parentNode) break;

      // Edge where this child is listed (gives union / bus geometry)
      const entry = childToEdge.get(childId);
      if (!entry) break;

      const { edge, child } = entry;

      // Bus Y: exact midpoint between union bottom and child top
      // (same formula TreeEdge uses to draw the horizontal bus)
      const busY = edge.unionY + (child.y - edge.unionY) / 2;

      // Blood-parent card center
      const ancestorCX = parentNode.x + parentNode.width / 2;
      const ancestorCY = parentNode.y + parentNode.height / 2;

      // V → H → V  (Stem up to bus, across bus, up to ancestor center)
      d += ` V ${busY}`;
      d += ` H ${ancestorCX}`;
      d += ` V ${ancestorCY}`;
    }

    return d;
  }, [bloodlineChain, nodes, edges]);

  if (!glowD) return null;

  return (
    <path
      d={glowD}
      className="ancestral-glow-path"
      fill="none"
      style={{ pointerEvents: 'none' }}
    />
  );
});

AncestralGlowPath.displayName = 'AncestralGlowPath';
export default AncestralGlowPath;
