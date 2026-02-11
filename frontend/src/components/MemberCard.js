import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Camera } from 'lucide-react';
import ProfileImage from '../components/ProfileImage';
import { calculateAge } from '../utils/dateUtils';
import { formatFullName } from '../utils/nameUtils';

const FleurDeLis = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ display: 'block' }}>
    <path d="M12 2C12 2 9 6 9 9c0 1.5.7 2.8 1.8 3.6C9.3 13.2 8 14.8 8 16.5c0 .7.1 1.3.4 1.9L6 17c-1.5-.5-2.5-1-3-1.5.5 1 1.5 2 3 2.5l2.8 1c.5 1 1.3 1.8 2.2 2.3V22h2v-.7c.9-.5 1.7-1.3 2.2-2.3l2.8-1c1.5-.5 2.5-1.5 3-2.5-.5.5-1.5 1-3 1.5l-2.4 1.4c.3-.6.4-1.2.4-1.9 0-1.7-1.3-3.3-2.8-3.9C15.3 11.8 16 10.5 16 9c0-3-3-7-3-7h-1z" />
  </svg>
);

const MemberCard = ({ member, memoryCounts, kinshipTitle }) => {
  if (!member) return null;

  const fullName = formatFullName(member);
  const age = calculateAge(member.birth_date, member.death_date);
  const isDeceased = member.is_alive === false || member.death_date !== null;
  const memories = memoryCounts || { stories: 0, photos: 0 };
  const totalMemories = memories.stories + memories.photos;

  const formatAgeDisplay = () => {
    if (age === null) return null;
    if (!isDeceased) return `${age} years old`;
    return `Lived ${age} years`;
  };

  const formatLifeYears = () => {
    const birthYear = member.birth_date ? new Date(member.birth_date).getFullYear() : null;
    const deathYear = member.death_date ? new Date(member.death_date).getFullYear() : null;
    if (!birthYear) return null;
    if (isDeceased && deathYear) return `${birthYear} \u2014 ${deathYear}`;
    return `b. ${birthYear}`;
  };

  return (
    <div className={`member-card-heirloom ${isDeceased ? 'card-deceased' : 'card-living'} group`}>
      {/* Fleur-de-lis for deceased members */}
      {isDeceased && (
        <div className="fleur-indicator" title="In Memoriam">
          <FleurDeLis />
        </div>
      )}

      {/* Kinship tooltip on hover */}
      {kinshipTitle && (
        <div className="kinship-tooltip">
          {kinshipTitle}
        </div>
      )}

      {/* Photo with memory badge */}
      <div className="heirloom-photo-wrap">
        <div className="heirloom-photo-ring">
          <ProfileImage
            member={member}
            size="medium"
            className=""
          />
        </div>
        {totalMemories > 0 && (
          <div className="memory-badge" title={`${memories.stories} stories, ${memories.photos} photos`}>
            {memories.stories > 0 && <><BookOpen style={{ width: 8, height: 8 }} /> {memories.stories}</>}
            {memories.stories > 0 && memories.photos > 0 && <span style={{ opacity: 0.5 }}>&middot;</span>}
            {memories.photos > 0 && <><Camera style={{ width: 8, height: 8 }} /> {memories.photos}</>}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="heirloom-name">{fullName || 'Unknown Name'}</h3>

      {/* Kinship subtitle (always visible if available) */}
      {kinshipTitle && (
        <p className="heirloom-kinship">{kinshipTitle}</p>
      )}

      {/* Ledger-style dates */}
      {formatLifeYears() && (
        <p className="heirloom-ledger">{formatLifeYears()}</p>
      )}
      {formatAgeDisplay() && !formatLifeYears() && (
        <p className="heirloom-ledger">{formatAgeDisplay()}</p>
      )}

      {/* Location */}
      <div className="heirloom-location">
        <MapPin style={{ width: 11, height: 11 }} />
        <span>{member.location || 'Unknown'}</span>
      </div>

      {/* Actions */}
      <div className="heirloom-actions">
        <Link to={`/members/${member.id || ''}`} className="btn-registry btn-registry-primary">
          View Profile
        </Link>
        <Link to={`/members/${member.id || ''}/edit`} className="btn-registry btn-registry-secondary">
          Edit
        </Link>
      </div>
    </div>
  );
};

MemberCard.propTypes = {
  member: PropTypes.shape({
    id: PropTypes.number.isRequired,
    first_name: PropTypes.string,
    middle_name: PropTypes.string,
    last_name: PropTypes.string,
    birth_date: PropTypes.string,
    death_date: PropTypes.string,
    photo_url: PropTypes.string,
    is_alive: PropTypes.bool,
    location: PropTypes.string
  }),
  memoryCounts: PropTypes.shape({
    stories: PropTypes.number,
    photos: PropTypes.number
  }),
  kinshipTitle: PropTypes.string
};

export default React.memo(MemberCard);
