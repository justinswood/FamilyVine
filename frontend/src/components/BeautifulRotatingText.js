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
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
        Explore Your Family's{' '}
        <div className="relative inline-block min-w-[120px] md:min-w-[160px] lg:min-w-[200px]">
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
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 rounded-xl blur-sm opacity-75 animate-pulse"></div>
                
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
      
      <p className="text-sm md:text-base text-white/90 mb-2 max-w-xl mx-auto leading-relaxed" 
         style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        Build, explore, and preserve your family tree with photos and relationships.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-2 justify-center mb-2">
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255, 255, 255, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-1.5 bg-white text-purple-600 rounded-md font-semibold shadow-lg transition-all hover:bg-gray-50 text-xs"
        >
          Start Exploring
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.05, borderColor: "#ffffff" }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-1.5 border-2 border-white/70 text-white rounded-md font-semibold hover:bg-white/10 transition-all text-xs"
        >
          Learn More
        </motion.button>
      </div>
      
      {/* Progress indicators */}
      <div className="flex justify-center mt-2 space-x-1">
        {words.map((_, index) => (
          <motion.div
            key={index}
            className={`w-1.5 h-1.5 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white/40'
            }`}
            animate={{
              scale: index === currentIndex ? 1.2 : 1,
              opacity: index === currentIndex ? 1 : 0.6
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};

export default BeautifulRotatingText;