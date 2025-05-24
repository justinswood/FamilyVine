// SUPER SIMPLE TEST VERSION
// Replace your ProfileImage.js with this to test if it's being used at all

import React from 'react';

const ProfileImage = ({ member, size = 'medium', className = '' }) => {
  console.log('🚀 ProfileImage component called!', member?.first_name);
  
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-32 h-32', 
    large: 'w-40 h-40',
    xl: 'w-48 h-48'
  };

  // Always return a simple placeholder for testing
  const testImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9IiNmZjAwMDAiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRFU1Q8L3RleHQ+PC9zdmc+';

  return (
    <div className="relative">
      <img
        src={testImageUrl}
        alt="Test"
        className={`${sizeClasses[size]} object-cover rounded-full ${className} border-4 border-red-500`}
      />
      <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-1">
        TEST
      </div>
    </div>
  );
};

export default ProfileImage;