import React from 'react';

const VineLogoCompact = () => {
  return (
    <div className="flex items-center">
      <img
        src="/logo.png"
        alt="FamilyVine"
        className="h-10 w-auto object-contain transition-all duration-300 hover:scale-105"
      />
    </div>
  );
};

export default VineLogoCompact;