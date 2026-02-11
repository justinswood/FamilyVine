/**
 * UnionDetailCard - Modal showing union (partnership) details.
 * Triggered by clicking a junction badge on the spouse connector.
 *
 * Displays partners side-by-side, union metadata, children grid,
 * and a notes/story section.
 */

import React, { memo, useEffect, useState } from 'react';
import { VINE_COLORS, VINE_FONTS } from '../greenhouse.js';

const UnionDetailCard = memo(({ unionId, apiUrl, onClose, onMemberClick }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unionId) return;

    const fetchUnion = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('familyVine_token');
        const resp = await fetch(`${apiUrl}/api/tree/unions/${unionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error('Failed to load union');
        const json = await resp.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnion();
  }, [unionId, apiUrl]);

  if (!unionId) return null;

  const photoSrc = (member) => {
    if (!member) return null;
    if (member.photo_url) return `${apiUrl}/${member.photo_url}`;
    const gender = member.gender?.toLowerCase() || 'male';
    const bg = gender === 'female' ? 'fce7f3' : 'dbeafe';
    const fg = gender === 'female' ? 'ec4899' : '3b82f6';
    const name = encodeURIComponent(`${member.first_name} ${member.last_name}`);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=${fg}&size=128`;
  };

  const formatYear = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `${VINE_COLORS.dark}CC` }}
      />

      {/* Card */}
      <div
        className="relative bg-vine-paper rounded-2xl shadow-2xl border border-vine-200
                   max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: VINE_FONTS.sans }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-vine-100
                     flex items-center justify-center text-vine-dark hover:bg-vine-200
                     transition-colors z-10"
        >
          &times;
        </button>

        {loading && (
          <div className="p-12 text-center text-vine-dark/50">
            Loading union details...
          </div>
        )}

        {error && (
          <div className="p-12 text-center text-red-600">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="p-6">
            {/* Partners */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* Partner 1 */}
              <PartnerAvatar
                member={data.partner1}
                photoSrc={photoSrc(data.partner1)}
                onClick={() => onMemberClick?.(data.partner1?.id)}
              />

              {/* Junction icon */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: VINE_COLORS.sage }}
                >
                  <span className="text-white text-xs font-bold">
                    {data.union_type === 'marriage' ? 'M' : data.union_type?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                {data.union_date && (
                  <span className="text-[10px] text-vine-dark/50 mt-1">
                    {formatYear(data.union_date)}
                  </span>
                )}
              </div>

              {/* Partner 2 */}
              <PartnerAvatar
                member={data.partner2}
                photoSrc={photoSrc(data.partner2)}
                onClick={() => onMemberClick?.(data.partner2?.id)}
              />
            </div>

            {/* Union info */}
            {data.union_location && (
              <p className="text-center text-sm text-vine-dark/60 mb-4">
                {data.union_location}
              </p>
            )}

            {/* Notes / Story */}
            {data.notes && (
              <div className="bg-vine-100/50 rounded-lg p-4 mb-5">
                <h4 className="text-xs font-bold text-vine-dark/60 uppercase tracking-wider mb-2">
                  Notes
                </h4>
                <p className="text-sm text-vine-dark/80 leading-relaxed whitespace-pre-wrap">
                  {data.notes}
                </p>
              </div>
            )}

            {/* Children */}
            {data.children && data.children.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-vine-dark/60 uppercase tracking-wider mb-3">
                  Children ({data.children.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {data.children.map((child) => (
                    <button
                      key={child.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white border border-vine-200
                                 hover:border-vine-sage hover:shadow-sm transition-all text-left"
                      onClick={() => onMemberClick?.(child.id)}
                    >
                      <img
                        src={photoSrc(child)}
                        alt={`${child.first_name} ${child.last_name}`}
                        className="w-9 h-9 rounded-full object-cover border-2 border-vine-100"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="min-w-0">
                        <p
                          className="text-sm font-semibold text-vine-dark truncate"
                          style={{ fontFamily: VINE_FONTS.serif }}
                        >
                          {child.first_name} {child.last_name}
                        </p>
                        <p className="text-[10px] text-vine-dark/50">
                          {formatYear(child.birth_date) || '?'}
                          {child.death_date ? ` - ${formatYear(child.death_date)}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Partner avatar with name.
 */
const PartnerAvatar = memo(({ member, photoSrc, onClick }) => {
  if (!member) return <div className="w-20" />;

  return (
    <button
      className="flex flex-col items-center gap-2 group"
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-vine-sage/40
                      group-hover:border-vine-sage transition-colors shadow-md">
        <img
          src={photoSrc}
          alt={`${member.first_name} ${member.last_name}`}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>
      <span
        className="text-sm font-semibold text-vine-dark text-center leading-tight"
        style={{ fontFamily: VINE_FONTS.serif }}
      >
        {member.first_name}
        <br />
        {member.last_name}
      </span>
    </button>
  );
});

UnionDetailCard.displayName = 'UnionDetailCard';
PartnerAvatar.displayName = 'PartnerAvatar';
export default UnionDetailCard;
