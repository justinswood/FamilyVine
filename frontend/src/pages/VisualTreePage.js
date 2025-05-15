import React from 'react';
import VisualFamilyTree from '../components/VisualFamilyTree';

const VisualTreePage = () => {
  return (
    <div className="max-w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Visual Family Tree</h1>
        <p className="text-gray-600 mt-2">
          Interactive visualization of family relationships. Click and drag nodes, zoom and pan to explore.
        </p>
      </div>
      <VisualFamilyTree />
    </div>
  );
};

export default VisualTreePage;