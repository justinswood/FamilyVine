import React from 'react';
import Orb from './Orb';
import './Orb.css';

const OrbProfilePhoto = ({ 
  member, 
  size = 150, 
  hue = 0, 
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false 
}) => {
  const fullName = `${member.first_name} ${member.last_name}`;
  
  return (
    <div 
      className="orb-wrapper" 
      style={{ width: size, height: size }}
    >
      {/* WebGL Orb Background */}
      <Orb 
        hue={hue}
        hoverIntensity={hoverIntensity}
        rotateOnHover={rotateOnHover}
        forceHoverState={forceHoverState}
      />
      
      {/* Member Photo in Center */}
      {member.photo_url && (
        <img
          src={`${process.env.REACT_APP_API}/${member.photo_url}`}
          alt={fullName}
          className="orb-photo"
          style={{
            width: size * 0.75, // Photo is 75% of orb size (shows more orb around edges)
            height: size * 0.75,
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      
      {/* Fallback if no photo */}
      {!member.photo_url && (
        <div 
          className="orb-photo"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.15, // Adjusted font size for new photo area
            fontWeight: 'bold',
            color: '#666'
          }}
        >
          {member.first_name?.[0]}{member.last_name?.[0]}
        </div>
      )}
    </div>
  );
};

export default OrbProfilePhoto;
