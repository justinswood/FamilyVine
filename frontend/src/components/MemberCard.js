// ===== UPDATED MemberCard.js =====
// frontend/src/components/MemberCard.js

import React from 'react';
import { Link } from 'react-router-dom';
import ProfileImage from './ProfileImage'; // Add this import

const MemberCard = ({ member }) => {
  const fullName = `${member.first_name || ''} ${member.middle_name ? ' ' + member.middle_name + ' ' : ' '}${member.last_name || ''}`.trim();
  
  const calculateAge = (birthDate, deathDate = null) => {
    if (!birthDate) return null;
    
    const birthOnly = birthDate.split('T')[0];
    const [birthYear, birthMonth, birthDay] = birthOnly.split('-').map(Number);
    const birth = new Date(birthYear, birthMonth - 1, birthDay);
    
    let endDate;
    if (deathDate) {
      const deathOnly = deathDate.split('T')[0];
      const [deathYear, deathMonth, deathDay] = deathOnly.split('-').map(Number);
      endDate = new Date(deathYear, deathMonth - 1, deathDay);
    } else {
      endDate = new Date();
    }
    
    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(member.birth_date, member.death_date);

  const formatAgeDisplay = (age, isAlive) => {
    if (age === null) return null;
    
    if (isAlive !== false) {
      return `${age} years old`;
    } else {
      return `Lived ${age} years`;
    }
  };

  const isDeceased = member.is_alive === false || member.death_date !== null;

  return (
    <div className="bg-white shadow rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
      <div className="relative mb-4 flex justify-center">
        <ProfileImage 
          member={member} 
          size="medium"
          className="shadow-md"
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
      
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{fullName}</h3>
      
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
      
      {/* Occupation */}
      {member.occupation && (
        <p className="text-gray-500 text-sm italic mb-3">{member.occupation}</p>
      )}
      
      <div className="flex justify-center space-x-3">
        <Link 
          to={`/members/${member.id}`} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          View
        </Link>
        <Link 
          to={`/members/${member.id}/edit`} 
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};

export default MemberCard;