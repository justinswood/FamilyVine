import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SimpleRotatingWords = () => {
  const words = ["Legacy", "History", "Stories", "Connections"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
        Explore Your Family's{' '}
        <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text inline-block min-w-[200px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIndex}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="inline-block"
            >
              {words[currentIndex]}
            </motion.span>
          </AnimatePresence>
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

export default SimpleRotatingWords;