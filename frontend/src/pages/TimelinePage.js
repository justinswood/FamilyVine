import React from 'react';
import Timeline from '../components/Timeline';

const TimelinePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="w-full px-4 py-4">
        <Timeline />
      </div>
    </div>
  );
};

export default TimelinePage;