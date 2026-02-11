import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * UnionConnector Component
 * An invisible node between spouses that serves as the routing point
 * for parent-child edges. This creates clean tree structure.
 */
const UnionConnector = ({ data }) => {
  return (
    <div
      style={{
        width: 10,
        height: 10,
        background: 'transparent',
        position: 'relative'
      }}
    >
      {/* Left handle - receives from partner 1 (on left) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1
        }}
      />

      {/* Right handle - sends to partner 2 (on right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1
        }}
      />

      {/* Bottom handle - sends to children below */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: 'transparent',
          border: 'none',
          width: 1,
          height: 1
        }}
      />
    </div>
  );
};

export default UnionConnector;
