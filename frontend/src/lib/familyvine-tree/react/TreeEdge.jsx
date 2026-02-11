/**
 * TreeEdge - Orthogonal family connectors for the family tree.
 *
 * Renders clean 90-degree "elbow" connectors:
 *   1. Stem: vertical line from union center-bottom to the midpoint of the gap
 *   2. Bus: horizontal line spanning from leftmost child to rightmost child
 *   3. Drops: vertical lines from bus into top-center of each child card
 *
 * Supports:
 *   - Dimming: non-path connectors fade when an ancestral path is active
 *   - Subtree collapse toggle: button on the stem to hide/show children
 *
 * Note: Ancestral glow is now rendered by AncestralGlowPath as a single
 * continuous path (eliminates joint breaks between segments).
 */

import React, { memo } from 'react';
import { VINE_COLORS } from '../greenhouse.js';

const TOGGLE_RADIUS = 10;

/**
 * TreeEdge - Renders a family connector with optional dimming and collapse toggle.
 */
const TreeEdge = memo(({ edge, activePath, collapsed, onToggleCollapse, timelineHiddenIds }) => {
  const { id, unionX, unionY, children } = edge;
  if (!children || children.length === 0) return null;

  const hasActivePath = activePath && activePath.size > 0;

  // Midpoint between union bottom and first child top
  const midY = unionY + (children[0].y - unionY) / 2;

  // Timeline: fade if ALL children are hidden
  const allChildrenHidden = timelineHiddenIds && timelineHiddenIds.size > 0 &&
    children.every(c => timelineHiddenIds.has(c.id));
  const timelineOpacity = allChildrenHidden ? 0 : 1;

  // When collapsed, only render the stem + toggle button (no bus or drops)
  if (collapsed) {
    return (
      <g className="family-connector-group" style={{ opacity: timelineOpacity, transition: 'opacity 0.5s ease' }}>
        {/* Short stem down to toggle */}
        <path
          d={`M ${unionX} ${unionY} V ${midY}`}
          stroke={VINE_COLORS.dark}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          opacity={0.35}
          className="connector-line"
        />

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <g
            className="subtree-toggle"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(id);
            }}
          >
            <circle
              cx={unionX}
              cy={midY}
              r={TOGGLE_RADIUS}
              fill={VINE_COLORS.paper}
              stroke={VINE_COLORS.sage}
              strokeWidth={1.5}
            />
            <text
              x={unionX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={VINE_COLORS.dark}
              fontSize="12"
              fontWeight="600"
              fontFamily="Inter, system-ui, sans-serif"
              style={{ pointerEvents: 'none' }}
            >
              +
            </text>
          </g>
        )}
      </g>
    );
  }

  // ----- Expanded state: base connector rendering -----

  // Does this connector touch the ancestral path?
  const anyChildOnPath = hasActivePath && children.some(c => activePath.has(c.id));

  // Dim non-path connectors when a path is active
  const dimmed = hasActivePath && !anyChildOnPath;

  const baseStroke = VINE_COLORS.dark;
  const baseOpacity = dimmed ? 0.15 : 0.35;
  const baseWidth = 2;

  // Build base path segments (no glow — glow is handled by AncestralGlowPath)
  const segments = [];

  if (children.length === 1) {
    const child = children[0];

    if (Math.abs(unionX - child.x) < 1) {
      segments.push({
        key: `${id}-direct`,
        d: `M ${unionX} ${unionY} V ${child.y}`,
      });
    } else {
      segments.push({
        key: `${id}-step`,
        d: `M ${unionX} ${unionY} V ${midY} H ${child.x} V ${child.y}`,
      });
    }
  } else {
    // Stem
    segments.push({
      key: `${id}-stem`,
      d: `M ${unionX} ${unionY} V ${midY}`,
    });

    // Bus (full span)
    const busLeftX = Math.min(children[0].x, unionX);
    const busRightX = Math.max(children[children.length - 1].x, unionX);
    segments.push({
      key: `${id}-bus`,
      d: `M ${busLeftX} ${midY} H ${busRightX}`,
    });

    // Drops
    children.forEach(child => {
      segments.push({
        key: `${id}-drop-${child.id}`,
        d: `M ${child.x} ${midY} V ${child.y}`,
      });
    });
  }

  return (
    <g className="family-connector-group" style={{ opacity: timelineOpacity, transition: 'opacity 0.5s ease' }}>
      {segments.map(seg => (
        <path
          key={seg.key}
          d={seg.d}
          stroke={baseStroke}
          strokeWidth={baseWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={baseOpacity}
          className="connector-line"
        />
      ))}

      {/* Collapse/expand toggle button on the stem */}
      {onToggleCollapse && (
        <g
          className="subtree-toggle"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(id);
          }}
        >
          <circle
            cx={unionX}
            cy={midY}
            r={TOGGLE_RADIUS}
            fill={VINE_COLORS.paper}
            stroke={VINE_COLORS.sage}
            strokeWidth={1.5}
          />
          <text
            x={unionX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fill={VINE_COLORS.dark}
            fontSize="12"
            fontWeight="600"
            fontFamily="Inter, system-ui, sans-serif"
            style={{ pointerEvents: 'none' }}
          >
            {'\u2212'}
          </text>
        </g>
      )}
    </g>
  );
});

TreeEdge.displayName = 'TreeEdge';
export default TreeEdge;
