/**
 * RelationshipFinder - "Kinship Discovery" Modal
 *
 * Displays the relationship between two selected family members with a
 * stylized "Bridge Card" on a gilded vellum overlay.
 */

import React, { useMemo } from 'react';
import { X, Users, Link2 } from 'lucide-react';
import { VINE_COLORS, VINE_FONTS } from '../greenhouse.js';
import { getFullKinshipInfo } from './kinship.js';

/**
 * Decorative vine connector between avatars
 */
const VineConnector = ({ className = '' }) => (
  <svg viewBox="0 0 120 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 12 Q30 2 60 12 Q90 22 120 12"
      stroke="var(--vine-green, #2E5A2E)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    {/* Small leaves along the vine */}
    <path d="M30 8 Q35 4 38 8 Q35 10 30 8" fill="var(--vine-sage, #86A789)" />
    <path d="M60 14 Q65 10 68 14 Q65 16 60 14" fill="var(--vine-sage, #86A789)" />
    <path d="M90 8 Q95 4 98 8 Q95 10 90 8" fill="var(--vine-sage, #86A789)" />
  </svg>
);

/**
 * Member Avatar with glow effect
 */
const MemberAvatar = ({ node, isAncestor = false, size = 100 }) => {
  const photoUrl = node?.photoUrl;
  const name = node ? `${node.firstName || ''} ${node.lastName || ''}`.trim() : '';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size }}
    >
      <div
        className={`rounded-full overflow-hidden border-4 ${isAncestor ? 'ancestor-glow' : ''}`}
        style={{
          width: size,
          height: size,
          borderColor: isAncestor ? 'var(--accent-gold, #D4AF37)' : VINE_COLORS.sage,
          boxShadow: isAncestor
            ? '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2)'
            : '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: VINE_COLORS.paper,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              backgroundColor: node?.gender === 'female' ? '#fce7f3' : '#dbeafe',
              color: node?.gender === 'female' ? '#ec4899' : '#3b82f6',
              fontSize: size * 0.35,
              fontFamily: VINE_FONTS.serif,
              fontWeight: 700,
            }}
          >
            {initials || '?'}
          </div>
        )}
      </div>
      <span
        className="mt-2 text-center font-medium"
        style={{
          color: VINE_COLORS.dark,
          fontFamily: VINE_FONTS.serif,
          fontSize: size < 80 ? '0.7rem' : '0.85rem',
          maxWidth: '120px',
          lineHeight: 1.2,
        }}
      >
        {name}
      </span>
    </div>
  );
};

/**
 * Main RelationshipFinder Component
 */
const RelationshipFinder = ({
  memberA,
  memberB,
  nodeMap,
  onClose,
  onViewPath,
}) => {
  // Compute kinship
  const kinshipInfo = useMemo(() => {
    if (!memberA || !memberB || !nodeMap) return null;
    return getFullKinshipInfo(nodeMap, memberA.id, memberB.id);
  }, [memberA, memberB, nodeMap]);

  // Get common ancestor node
  const commonAncestor = useMemo(() => {
    if (!kinshipInfo?.commonAncestorId || !nodeMap) return null;
    return nodeMap.get(kinshipInfo.commonAncestorId);
  }, [kinshipInfo, nodeMap]);

  if (!memberA || !memberB || !kinshipInfo) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(45, 79, 30, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      {/* Bridge Card */}
      <div
        className="relative max-w-lg w-full rounded-2xl overflow-hidden animate-slideUp"
        style={{
          backgroundColor: VINE_COLORS.paper,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top border */}
        <div
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, var(--vine-green) 0%, var(--accent-gold, #D4AF37) 50%, var(--vine-green) 100%)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors z-10"
          style={{ color: VINE_COLORS.sage }}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link2 className="w-5 h-5" style={{ color: 'var(--accent-gold, #D4AF37)' }} />
            <h2
              className="text-lg font-bold"
              style={{
                color: VINE_COLORS.dark,
                fontFamily: VINE_FONTS.serif,
              }}
            >
              Family Connection
            </h2>
          </div>

          {/* Gold divider */}
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0) 100%)',
              margin: '12px 0',
            }}
          />
        </div>

        {/* Members with vine connector */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <MemberAvatar node={memberA} size={100} />

            <div className="flex-1 flex flex-col items-center px-4">
              <VineConnector className="w-full max-w-[120px] mb-3" />

              {/* Relationship Title */}
              <div
                className="px-4 py-2 rounded-full text-center"
                style={{
                  backgroundColor: 'rgba(46, 90, 46, 0.1)',
                  border: '2px solid var(--vine-green, #2E5A2E)',
                }}
              >
                <span
                  className="font-bold"
                  style={{
                    color: VINE_COLORS.dark,
                    fontFamily: VINE_FONTS.serif,
                    fontSize: '1.1rem',
                  }}
                >
                  {kinshipInfo.isHalf ? 'Half-' : ''}{kinshipInfo.title}
                </span>
              </div>

              {/* Generational info */}
              <p
                className="mt-2 text-center text-xs"
                style={{ color: VINE_COLORS.sage, fontFamily: VINE_FONTS.sans }}
              >
                {kinshipInfo.up > 0 && `${kinshipInfo.up} generation${kinshipInfo.up > 1 ? 's' : ''} up`}
                {kinshipInfo.up > 0 && kinshipInfo.down > 0 && ', '}
                {kinshipInfo.down > 0 && `${kinshipInfo.down} generation${kinshipInfo.down > 1 ? 's' : ''} down`}
              </p>
            </div>

            <MemberAvatar node={memberB} size={100} />
          </div>

          {/* Common Ancestor Section */}
          {commonAncestor && kinshipInfo.commonAncestorId !== memberA.id && kinshipInfo.commonAncestorId !== memberB.id && (
            <div className="mt-3 pt-2" style={{ borderTop: '1px dashed rgba(134, 167, 137, 0.3)' }}>
              <p
                className="text-center text-xs mb-1"
                style={{ color: VINE_COLORS.sage, fontFamily: VINE_FONTS.sans, fontSize: '0.65rem' }}
              >
                Connected through
              </p>
              <div className="flex justify-center">
                <MemberAvatar node={commonAncestor} isAncestor size={50} />
              </div>
            </div>
          )}

          {/* View Path Button */}
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => onViewPath?.(kinshipInfo)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all hover:scale-105"
              style={{
                backgroundColor: VINE_COLORS.leaf,
                color: '#fff',
                fontFamily: VINE_FONTS.sans,
                boxShadow: '0 2px 6px rgba(46, 90, 46, 0.3)',
                fontSize: '0.7rem',
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Show Connection on Tree
            </button>
          </div>
        </div>

        {/* Decorative bottom corners */}
        <div
          className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at bottom left, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at bottom right, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .ancestor-glow {
          animation: ancestorPulse 2s ease-in-out infinite;
        }
        @keyframes ancestorPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(212, 175, 55, 0.7), 0 0 60px rgba(212, 175, 55, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default RelationshipFinder;
