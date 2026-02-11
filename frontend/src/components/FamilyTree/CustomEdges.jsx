import React from 'react';
import { getSmoothStepPath, getStraightPath } from 'reactflow';

/**
 * ParentChildEdge Component
 * Vertical edge from parent union connector to child
 * Uses smooth step path for clean orthogonal routing
 */
export const ParentChildEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}) => {
  // Use smooth step path for orthogonal routing (L-shaped lines)
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0, // Sharp corners for family tree look
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={{
        stroke: '#ffffff',
        strokeWidth: 3,
        fill: 'none',
        ...style,
      }}
    />
  );
};

/**
 * SpouseEdge Component
 * Horizontal edge connecting spouses through the union connector
 * Uses straight path since spouses are on the same Y level
 */
export const SpouseEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
}) => {
  // Simple straight line for spouse connections (horizontal)
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={edgePath}
      style={{
        stroke: '#ffffff',
        strokeWidth: 4,
        fill: 'none',
        ...style,
      }}
    />
  );
};
