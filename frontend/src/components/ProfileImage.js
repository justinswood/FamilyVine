import React, { useState } from 'react';

const ProfileImage = ({ 
  member, 
  size = 'medium', 
  className = '', 
  alt = null 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Size options for easy use
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
    extra_large: 'w-64 h-64'
  };

  // Use the size prop or fall back to custom size if it's not in our preset
  const sizeClass = sizeClasses[size] || size;
  
  // Safety check: if member is undefined or null, show a default placeholder
  if (!member) {
    return (
      <div className={`${sizeClass} bg-gray-200 rounded-full flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-2xl">?</span>
      </div>
    );
  }
  
  const handleImageError = () => {
    setImageError(true);
  };

  const getPhotoUrl = (member) => {
    if (!member.photo_url) return null;
    
    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }
    
    const cleanPath = member.photo_url.startsWith('/') 
      ? member.photo_url.substring(1) 
      : member.photo_url;
    
    return `${process.env.REACT_APP_API}/${cleanPath}`;
  };

  const createPlaceholderSVG = (member) => {
    // Safe access to member properties with fallbacks
    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    
    const isMale = member.gender === 'Male';
    const bgColor = isMale ? '#3B82F6' : '#EC4899'; // Blue for male, pink for female
    const textColor = '#FFFFFF';
    
    // Calculate font size based on image size
    let fontSize = '48';
    if (size === 'small') fontSize = '24';
    else if (size === 'medium') fontSize = '48';
    else if (size === 'large') fontSize = '72';
    else if (size === 'extra_large') fontSize = '96';
    
    const svgContent = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="${bgColor}"/>
        <text x="100" y="${parseInt(fontSize) + 20}" font-family="Arial, sans-serif" 
              font-size="${fontSize}" font-weight="bold" 
              text-anchor="middle" fill="${textColor}">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  };

  const photoUrl = getPhotoUrl(member);
  const shouldShowPlaceholder = !photoUrl || imageError;
  
  // Safe access to member properties for alt text
  const firstName = member.first_name || '';
  const lastName = member.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <img
      src={shouldShowPlaceholder ? createPlaceholderSVG(member) : photoUrl}
      alt={alt || fullName || 'Family member'}
      className={`${sizeClass} object-cover rounded-full ${className}`}
      onError={handleImageError}
      loading="lazy"
    />
  );
};

export default ProfileImage;