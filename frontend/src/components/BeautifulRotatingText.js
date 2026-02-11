import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BeautifulRotatingText.css';

const BeautifulRotatingText = () => {
  const words = ["Legacy", "History", "Stories", "Future"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 2625); // 25% faster than original 3500ms (3500 * 0.75 = 2625)

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-1.5 leading-tight">
        Explore Your Family's{' '}
        <div className="relative inline-block min-w-[100px] md:min-w-[140px] lg:min-w-[180px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ 
                y: 40, 
                opacity: 0,
                scale: 0.8,
                rotateX: -20
              }}
              animate={{ 
                y: 0, 
                opacity: 1,
                scale: 1,
                rotateX: 0
              }}
              exit={{ 
                y: -40, 
                opacity: 0,
                scale: 0.8,
                rotateX: 20
              }}
              transition={{ 
                duration: 0.6, 
                ease: [0.25, 0.46, 0.45, 0.94],
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              className="inline-block w-full text-center"
            >
              <span className="relative inline-block px-3 py-1">
                {/* Background with gradient and shadow */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-xl shadow-2xl transform -skew-x-6"></div>
                
                {/* Glowing border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-vine-400 via-vine-leaf to-vine-600 rounded-xl blur-sm opacity-75 animate-pulse"></div>
                
                {/* Inner background */}
                <div className="absolute inset-1 bg-black rounded-lg"></div>
                
                {/* Text */}
                <span className="relative text-white font-bold tracking-wide text-shadow-lg">
                  {words[currentIndex]}
                </span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </h1>
    </div>
  );
};

export default BeautifulRotatingText;