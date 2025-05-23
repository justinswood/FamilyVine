import React from 'react';
import Timeline from '../components/Timeline';

const TimelinePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Timeline />
      </div>
    </div>
  );
};

export default TimelinePage;