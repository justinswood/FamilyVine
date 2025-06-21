import React from 'react';

const SimpleRotatingTest = () => {
  return (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
        Explore Your Family's{' '}
        <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
          Legacy
        </span>
      </h1>
      
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
        Build, explore, and preserve your family tree with photos, 
        relationships, and interactive visualizations.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg">
          Start Exploring
        </button>
        <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default SimpleRotatingTest;