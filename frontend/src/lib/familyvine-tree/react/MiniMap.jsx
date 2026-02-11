/**
 * MiniMap - React-based overview minimap for the family tree.
 */

import React, { memo, useCallback, useRef } from 'react';
import { VINE_COLORS } from '../greenhouse.js';

const MiniMap = memo(({ nodes, bounds, viewport, onNavigate, width = 100, height = 75 }) => {
  const svgRef = useRef(null);

  if (!bounds || nodes.length === 0) return null;

  const padding = 10;
  const treeW = bounds.maxX - bounds.minX;
  const treeH = bounds.maxY - bounds.minY;
  const scaleX = (width - padding * 2) / treeW;
  const scaleY = (height - padding * 2) / treeH;
  const scale = Math.min(scaleX, scaleY);
  const offX = padding - bounds.minX * scale;
  const offY = padding - bounds.minY * scale;

  const handleClick = useCallback((e) => {
    if (!svgRef.current || !onNavigate) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offX) / scale;
    const clickY = (e.clientY - rect.top - offY) / scale;
    onNavigate({ x: clickX, y: clickY });
  }, [offX, offY, scale, onNavigate]);

  return (
    <div
      className="absolute bottom-4 right-4 rounded-lg shadow-lg border overflow-hidden z-50"
      style={{
        backgroundColor: `${VINE_COLORS.dark}80`,
        borderColor: `${VINE_COLORS.sage}40`,
        backdropFilter: 'blur(8px)',
        opacity: 0.6,
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onClick={handleClick}
        style={{ cursor: 'pointer', display: 'block' }}
      >
        {/* Node indicators */}
        {nodes.map(node => (
          <rect
            key={node.id}
            x={node.x * scale + offX}
            y={node.y * scale + offY}
            width={Math.max(node.width * scale, 3)}
            height={Math.max(node.height * scale, 2)}
            fill={VINE_COLORS.sage}
            opacity={0.6}
            rx={1}
          />
        ))}

        {/* Viewport indicator */}
        {viewport && (
          <rect
            x={viewport.x * scale + offX}
            y={viewport.y * scale + offY}
            width={viewport.width * scale}
            height={viewport.height * scale}
            fill="rgba(255,255,255,0.12)"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1.5}
            rx={2}
          />
        )}
      </svg>
    </div>
  );
});

MiniMap.displayName = 'MiniMap';
export default MiniMap;
