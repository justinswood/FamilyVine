import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Handle, Position } from 'reactflow';

/**
 * FamilyTreeNode Component
 * Custom ReactFlow node for displaying family members
 */
const FamilyTreeNode = ({ data }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/members/${data.memberId}`);
  };

  // Gender-based gradient colors
  const gradientClass = data.gender === 'female'
    ? 'bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600'
    : 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600';

  return (
    <>
      {/* Top handle - receives parent-child edges from above */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: 'transparent', border: 'none' }}
      />

      {/* Bottom handle - sends parent-child edges to children below */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'transparent', border: 'none' }}
      />

      {/* Left handle - receives spouse connection (for partner on right) */}
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-left"
        style={{ background: 'transparent', border: 'none' }}
      />

      {/* Right handle - sends spouse connection (for partner on left) */}
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        style={{ background: 'transparent', border: 'none' }}
      />

      {/* Node card */}
      <div
        className={`
          w-[200px] h-[155px]
          ${gradientClass}
          rounded-lg shadow-lg
          cursor-pointer
          transition-transform hover:scale-105 hover:shadow-xl
          flex flex-col items-center justify-start
          pt-3
        `}
        onClick={handleClick}
        style={{
          border: '2px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Circular profile image */}
        <div className="flex justify-center mb-2">
          <div className="w-[100px] h-[100px] rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
            <img
              src={data.img}
              alt={data.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="text-center px-2 w-full">
          <p className="text-white font-bold text-lg leading-tight truncate">
            {data.name}
          </p>
        </div>

        {/* Birth-Death dates */}
        {data.birth && (
          <div className="text-center px-2 w-full mt-0.5">
            <p className="text-white text-sm">
              {data.birth}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default FamilyTreeNode;
