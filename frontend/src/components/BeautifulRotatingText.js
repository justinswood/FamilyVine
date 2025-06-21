import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BeautifulRotatingText.css';

const BeautifulRotatingText = () => {
  const words = ["Legacy", "History", "Stories", "Future"];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="text-center max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
        Explore Your Family's{' '}
        <div className="relative inline-block">
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
              className="inline-block"
            >
              <span className="relative inline-block px-6 py-3 mx-2">
                {/* Background with gradient and shadow */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-black to-gray-900 rounded-xl shadow-2xl transform -skew-x-6"></div>
                
                {/* Glowing border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-75 animate-pulse"></div>
                
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
      
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
        Build, explore, and preserve your family tree with photos, 
        relationships, and interactive visualizations.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg transition-all"
        >
          Start Exploring
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05, borderColor: "#6366f1" }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
        >
          Learn More
        </motion.button>
      </div>
      
      {/* Progress indicators */}
      <div className="flex justify-center mt-8 space-x-2">
        {words.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-purple-600' : 'bg-gray-300'
            }`}
            animate={{
              scale: index === currentIndex ? 1.2 : 1,
              opacity: index === currentIndex ? 1 : 0.5
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};

export default BeautifulRotatingText;