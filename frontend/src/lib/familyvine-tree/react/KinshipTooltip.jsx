/**
 * KinshipTooltip - Floating tooltip showing the relationship
 * between the hovered person and the tree root.
 *
 * Uses ref-based mouse tracking for performance (no re-renders on mousemove).
 * Positioned with `position: fixed` so it follows the cursor across the viewport.
 */

import React, { useRef, useEffect, memo, useMemo } from 'react';
import { VINE_COLORS, VINE_FONTS } from '../greenhouse.js';
import { computeBestKinship } from './kinship.js';

const KinshipTooltip = memo(({ hoveredId, nodeMap, rootIds }) => {
  const tooltipRef = useRef(null);
  const rafId = useRef(null);

  // Track mouse position imperatively (no re-renders)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!tooltipRef.current) return;

      if (rafId.current) return; // throttle to one rAF
      rafId.current = requestAnimationFrame(() => {
        if (tooltipRef.current) {
          tooltipRef.current.style.left = `${e.clientX + 16}px`;
          tooltipRef.current.style.top = `${e.clientY + 25}px`;
        }
        rafId.current = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Compute kinship
  const kinship = useMemo(() => {
    if (!hoveredId || !nodeMap || !rootIds || rootIds.length === 0) return null;
    return computeBestKinship(nodeMap, rootIds, hoveredId);
  }, [hoveredId, nodeMap, rootIds]);

  // Hovered person's name
  const hoveredName = useMemo(() => {
    if (!hoveredId || !nodeMap) return '';
    const node = nodeMap.get(hoveredId);
    return node ? `${node.firstName} ${node.lastName}`.trim() : '';
  }, [hoveredId, nodeMap]);

  if (!kinship) return null;

  return (
    <div
      ref={tooltipRef}
      className="relationship-breadcrumb"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid #800080',
        borderRadius: '4px',
        padding: '4px 8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: VINE_FONTS.sans,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s ease',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#800080',
        }}
      >
        {kinship.title}
      </div>
      <div
        style={{
          fontSize: '9px',
          color: '#64748b',
          marginTop: '1px',
        }}
      >
        {hoveredName} &middot; to {kinship.rootName}
      </div>
    </div>
  );
});

KinshipTooltip.displayName = 'KinshipTooltip';
export default KinshipTooltip;
