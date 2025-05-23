import React, { useState } from 'react';

const ProfileImage = ({ 
  member, 
  size = 'large',
  className = '',
  onClick = null 
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20', 
    large: 'w-40 h-40'
  };

  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-20 h-20'
  };

  const getPhotoUrl = (member) => {
    if (imageError || !member.photo_url) {
      return null;
    }

    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }

    const cleanPath = member.photo_url.startsWith('/') 
      ? member.photo_url.substring(1) 
      : member.photo_url;

    return `${process.env.REACT_APP_API}/${cleanPath}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const photoUrl = getPhotoUrl(member);

  const getPlaceholderContent = () => {
    const iconSize = iconSizes[size];
    
    if (member.gender === 'Male') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-blue-100 text-blue-600">
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="text-xs mt-1 font-medium">Male</span>
        </div>
      );
    } else if (member.gender === 'Female') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-pink-100 text-pink-600">
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="text-xs mt-1 font-medium">Female</span>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-600">
          <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span className="text-xs mt-1 font-medium">Person</span>
        </div>
      );
    }
  };

  const baseClasses = `${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 ${className}`;
  const clickableClasses = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <div 
      className={`${baseClasses} ${clickableClasses}`}
      onClick={onClick}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`${member.first_name} ${member.last_name}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        getPlaceholderContent()
      )}
    </div>
  );
};

export default ProfileImage;