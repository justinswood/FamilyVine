/**
 * UnionUnit - Renders a married couple as a single visual unit.
 *
 * Instead of two separate foreignObject TreeNodes with a spouse edge between them,
 * the UnionUnit wraps both partner cards in a single foreignObject using CSS Flexbox
 * (flex-direction: row) to guarantee side-by-side layout.
 *
 * A junction badge between the cards indicates the union and is clickable
 * to open the UnionDetailCard.
 *
 * This eliminates "laddering" where couples stack vertically.
 */

import React, { memo } from 'react';
import { VINE_COLORS, VINE_FONTS } from '../greenhouse.js';

const JUNCTION_SIZE = 16;

const UnionUnit = memo(({
  unit, onNodeClick, onJunctionClick, activePath, bloodlineSet, isPathActive, onHover,
  timelineHiddenIds, founderIds, selectionMode, selectedMemberA, selectedMemberB, kinshipResult
}) => {
  const { partners, x, y, width, height, unionId, unionType, divorceDate } = unit;
  const [left, right] = partners;

  // Only show heart badge for marriages that aren't divorced
  const showHeartBadge = unionType === 'marriage' && divorceDate == null;

  // Gap between the two partner cards (derived from layout positions)
  const gap = width - (left.width + right.width);

  // Timeline: fade if any partner is born after the timeline year
  const anyPartnerHidden = timelineHiddenIds && timelineHiddenIds.size > 0 &&
    (timelineHiddenIds.has(left.id) || timelineHiddenIds.has(right.id));

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      className="overflow-visible"
      style={{
        opacity: anyPartnerHidden ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: anyPartnerHidden ? 'none' : 'auto',
      }}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className="union-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: `${gap}px`,
          width: `${width}px`,
          height: `${height}px`,
          position: 'relative',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {/* Shared background wash to visually bind the couple */}
        <div
          className="union-bg"
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-6px',
            right: '-6px',
            bottom: '-4px',
            backgroundColor: 'rgba(134, 167, 137, 0.08)',
            borderRadius: '16px',
            border: '1px dashed rgba(134, 167, 137, 0.2)',
            pointerEvents: 'none',
          }}
        />

        {/* Left partner card */}
        <PartnerCard
          node={left}
          onClick={onNodeClick}
          isGlowing={activePath?.has(left.id)}
          isBloodline={bloodlineSet?.has(left.id)}
          isPathActive={isPathActive}
          onHover={onHover}
          isFounder={founderIds?.has(left.id)}
          selectionMode={selectionMode}
          isSelectedA={selectedMemberA?.id === left.id}
          isSelectedB={selectedMemberB?.id === left.id}
          isOnKinshipPath={kinshipResult?.fullPath?.includes(left.id)}
          isCommonAncestor={kinshipResult?.commonAncestorId === left.id}
        />

        {/* Right partner card */}
        <PartnerCard
          node={right}
          onClick={onNodeClick}
          isGlowing={activePath?.has(right.id)}
          isBloodline={bloodlineSet?.has(right.id)}
          isPathActive={isPathActive}
          onHover={onHover}
          isFounder={founderIds?.has(right.id)}
          selectionMode={selectionMode}
          isSelectedA={selectedMemberA?.id === right.id}
          isSelectedB={selectedMemberB?.id === right.id}
          isOnKinshipPath={kinshipResult?.fullPath?.includes(right.id)}
          isCommonAncestor={kinshipResult?.commonAncestorId === right.id}
        />

        {/* Junction badge centered between partners - only shown for married (not divorced) couples */}
        {showHeartBadge && (
          <div
            className="union-junction-badge"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${JUNCTION_SIZE}px`,
              height: `${JUNCTION_SIZE}px`,
              borderRadius: '50%',
              backgroundColor: VINE_COLORS.sage,
              border: `2px solid ${VINE_COLORS.paper}`,
              cursor: unionId ? 'pointer' : 'default',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              transition: 'box-shadow 0.2s ease',
            }}
            onClick={(e) => {
              if (!unionId) return;
              e.stopPropagation();
              onJunctionClick?.({ unionId });
            }}
            onMouseEnter={(e) => {
              if (unionId) {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
            }}
          >
            <span style={{
              color: 'white',
              fontSize: '9px',
              fontWeight: 'bold',
              lineHeight: 0,
              display: 'block',
              paddingTop: '1px',
            }}>
              &#9829;
            </span>
          </div>
        )}
      </div>
    </foreignObject>
  );
});

/**
 * PartnerCard - Individual person card within a UnionUnit.
 * Matches TreeNode styling for visual consistency.
 */
const PartnerCard = memo(({
  node, onClick, isGlowing, isBloodline, isPathActive, onHover, isFounder,
  selectionMode, isSelectedA, isSelectedB, isOnKinshipPath, isCommonAncestor
}) => {
  const { firstName, lastName, suffix, gender, birthYear, deathYear, photoUrl, width, height } = node;
  const fullName = [firstName, lastName, suffix].filter(Boolean).join(' ').trim();

  const isFemale = gender === 'female';
  const borderColor = isFemale ? VINE_COLORS.wood : VINE_COLORS.dark;
  const accentBg = isFemale ? 'rgba(251, 113, 133, 0.5)' : 'rgba(96, 165, 250, 0.5)';

  const cardClasses = [
    'partner-card',
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
    <div
      className={cardClasses}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
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
        flexShrink: 0,
      }}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onHover?.(node)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Profile photo */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          width: '56px',
          height: '56px',
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
              fontSize: '20px',
              color: '#94a3b8',
            }}
          >
            &#128100;
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{ marginTop: '24px', textAlign: 'center', width: '100%' }}>
        <h3
          style={{
            fontFamily: VINE_FONTS.serif,
            fontWeight: 700,
            fontSize: '16px',
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
            fontSize: '12px',
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
  );
});

UnionUnit.displayName = 'UnionUnit';
PartnerCard.displayName = 'PartnerCard';
export default UnionUnit;
