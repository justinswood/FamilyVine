import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ProfileImage from '../components/ProfileImage';
import { calculateAge } from '../utils/dateUtils';

const MemberCard = ({ member }) => {
  // Safety check: if member is undefined, don't render anything
  if (!member) {
    return null;
  }

  const fullName = `${member.first_name || ''} ${member.middle_name ? ' ' + member.middle_name + ' ' : ' '}${member.last_name || ''}`.trim();
  const age = calculateAge(member.birth_date, member.death_date);

  // Format age display based on whether member is alive or deceased
  const formatAgeDisplay = (age, isAlive) => {
    if (age === null) return null;
    
    if (isAlive !== false) {
      return `${age} years old`;
    } else {
      return `Lived ${age} years`;
    }
  };

  // Check if member is deceased (handles both is_alive false and death_date)
  const isDeceased = member.is_alive === false || member.death_date !== null;

  return (
    <div className="bg-white shadow rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
      <div className="relative mb-4 flex justify-center">
        {/* Use ProfileImage component with safety checks */}
        <ProfileImage 
          member={member} 
          size="medium" 
          className="border-2 border-gray-200" 
        />
        
        {/* Deceased indicator */}
        {isDeceased && (
          <div className="absolute -top-1 -right-1 bg-gray-100 rounded-full p-1 border-2 border-white shadow-sm">
            <span 
              className="text-gray-600" 
              title="Deceased"
              style={{ fontSize: '1.5em', lineHeight: '1' }}
            >
              ✝
            </span>
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{fullName || 'Unknown Name'}</h3>
      
      {/* Age display */}
      {age !== null && (
        <p className="text-gray-500 text-sm mb-2">
          {formatAgeDisplay(age, member.is_alive)}
        </p>
      )}
      
      {/* Location with icon */}
      <div className="text-gray-600 mb-2 flex justify-center items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{member.location || 'Location not specified'}</span>
      </div>
      
      <div className="flex justify-center space-x-3">
        <Link 
          to={`/members/${member.id || ''}`} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          View
        </Link>
        <Link 
          to={`/members/${member.id || ''}/edit`} 
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
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
    is_alive: PropTypes.bool
  })
};

export default React.memo(MemberCard);