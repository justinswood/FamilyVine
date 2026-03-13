/**
 * TreeNode - foreignObject-based React node component
 * Renders inside SVG as an HTML card styled with Tailwind.
 */

import React, { memo } from 'react';
import { VINE_COLORS, VINE_FONTS } from '../greenhouse.js';

const TreeNode = memo(({
  node, onClick, isGlowing, isBloodline, isPathActive, onHover, timelineHidden, isFounder,
  selectionMode, isSelectedA, isSelectedB, isOnKinshipPath, isCommonAncestor
}) => {
  const { id, firstName, lastName, suffix, gender, birthYear, deathYear, photoUrl, x, y, width, height } = node;

  const fullName = [firstName, lastName, suffix].filter(Boolean).join(' ').trim();

  // Responsive sizing — mobile config uses width <= 140
  const compact = width <= 140;

  // Gender-based accent
  const isFemale = gender === 'female';
  const borderColor = isFemale ? VINE_COLORS.wood : VINE_COLORS.dark;
  const accentBg = isFemale ? 'rgba(251, 113, 133, 0.5)' : 'rgba(96, 165, 250, 0.5)';

  // Build class list for glow state
  const cardClasses = [
    'person-card',
    isBloodline ? 'active-glow-primary' : (isGlowing ? 'active-glow' : ''),
    isPathActive && !isGlowing ? 'dimmed' : '',
    isFounder ? 'founder-card' : '',
    // Selection mode classes
    selectionMode ? 'selectable' : '',
    isSelectedA ? 'kinship-selected kinship-selected-a' : '',
    isSelectedB ? 'kinship-selected kinship-selected-b' : '',
    isOnKinshipPath && !isSelectedA && !isSelectedB ? 'kinship-path-member' : '',
    isCommonAncestor ? 'kinship-common-ancestor' : '',
  ].filter(Boolean).join(' ');

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      className="overflow-visible"
      style={{
        opacity: timelineHidden ? 0 : 1,
        transition: 'opacity 0.2s ease',
        pointerEvents: timelineHidden ? 'none' : 'auto',
      }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={cardClasses}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: compact ? '8px' : '12px',
          borderRadius: '12px',
          border: `2px solid ${borderColor}`,
          backgroundColor: VINE_COLORS.paper,
          width: `${width}px`,
          height: `${height}px`,
          cursor: 'pointer',
          fontFamily: VINE_FONTS.sans,
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
        onClick={() => onClick?.(node)}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') onHover?.(node); }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') onHover?.(null); }}
      >
        {/* Profile photo */}
        <div
          style={{
            position: 'absolute',
            top: compact ? '-18px' : '-24px',
            width: compact ? '44px' : '56px',
            height: compact ? '44px' : '56px',
            borderRadius: '50%',
            border: '4px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            backgroundColor: '#e2e8f0',
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: compact ? '16px' : '20px',
                color: '#94a3b8',
              }}
            >
              &#128100;
            </span>
          )}
        </div>

        {/* Name + Years */}
        <div style={{ marginTop: compact ? '18px' : '24px', textAlign: 'center', width: '100%' }}>
          <h3
            style={{
              fontFamily: VINE_FONTS.serif,
              fontWeight: 700,
              fontSize: compact ? '13px' : '16px',
              lineHeight: 1.4,
              color: VINE_COLORS.wood,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              margin: 0,
            }}
          >
            {fullName}
          </h3>

          <p
            style={{
              fontFamily: VINE_FONTS.sans,
              fontWeight: 400,
              fontSize: compact ? '10px' : '12px',
              lineHeight: 1.4,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '4px 0 0 0',
            }}
          >
            {birthYear || '????'} &mdash; {deathYear || 'Present'}
          </p>
        </div>

        {/* Gender accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            borderRadius: '0 0 10px 10px',
            backgroundColor: accentBg,
          }}
        />
      </div>
    </foreignObject>
  );
});

TreeNode.displayName = 'TreeNode';
export default TreeNode;
