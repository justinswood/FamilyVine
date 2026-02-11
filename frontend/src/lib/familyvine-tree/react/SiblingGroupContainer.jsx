/**
 * SiblingGroupContainer - Ghost dashed container for 2-column sibling groups.
 */

import React, { memo } from 'react';
import { VINE_COLORS } from '../greenhouse.js';
import LayoutConfig from '../core/layout/LayoutConfig.js';

const GHOST_PAD = LayoutConfig.GHOST_PADDING || 16;

const SiblingGroupContainer = memo(({ group, collapsed, onToggle }) => {
  const { id, bounds, childNodeIds } = group;

  const x = bounds.x - GHOST_PAD;
  const y = bounds.y - GHOST_PAD;
  const w = bounds.width + GHOST_PAD * 2;
  const h = collapsed ? 44 : bounds.height + GHOST_PAD * 2;

  return (
    <g className="sibling-group-container" data-group-id={id}>
      {/* Dashed border container */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={16}
        ry={16}
        fill={`${VINE_COLORS.sage}10`}
        stroke={VINE_COLORS.sage}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.5}
        style={{ transition: 'height 0.3s ease, opacity 0.2s ease' }}
      />

      {/* Count label */}
      <text
        x={x + w - 36}
        y={y - 5}
        textAnchor="end"
        fill={VINE_COLORS.sage}
        fontSize={10}
        fontWeight="bold"
        letterSpacing="0.5"
        style={{ textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}
      >
        {childNodeIds.length} Siblings
      </text>

      {/* Collapse/Expand toggle */}
      <foreignObject
        x={x + w - 32}
        y={y + 8}
        width={24}
        height={24}
        className="overflow-visible"
      >
        <div xmlns="http://www.w3.org/1999/xhtml">
          <button
            className="w-6 h-6 rounded-full bg-vine-sage/30 hover:bg-vine-sage/50
                       flex items-center justify-center text-vine-dark text-xs font-bold
                       transition-colors duration-150 cursor-pointer border border-vine-sage/40"
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(id);
            }}
            title={collapsed ? 'Expand group' : 'Collapse group'}
          >
            {collapsed ? '+' : '\u2212'}
          </button>
        </div>
      </foreignObject>

      {/* Collapsed summary */}
      {collapsed && (
        <foreignObject x={x + 12} y={y + 10} width={w - 56} height={24}>
          <div xmlns="http://www.w3.org/1999/xhtml">
            <span className="text-xs text-vine-dark/60 font-inter font-medium">
              {childNodeIds.length} members
            </span>
          </div>
        </foreignObject>
      )}
    </g>
  );
});

SiblingGroupContainer.displayName = 'SiblingGroupContainer';
export default SiblingGroupContainer;
