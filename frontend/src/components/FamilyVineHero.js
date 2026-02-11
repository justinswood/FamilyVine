import React from 'react';
import RotatingText from './RotatingText';

const FamilyVineHero = () => {
  const texts = ["Legacy", "History", "Stories", "Connections"];

  return (
    <div className="text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-heading font-bold text-vine-dark mb-6">
        Explore Your Family's{' '}
        <span className="text-transparent bg-gradient-to-r from-vine-500 to-vine-600 bg-clip-text">
          <RotatingText
            texts={texts}
            rotationInterval={3000}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            staggerDuration={0.02}
            splitBy="characters"
            mainClassName="inline-flex"
          />
        </span>
      </h1>
      
      <p className="text-xl text-vine-sage mb-8 max-w-2xl mx-auto leading-relaxed">
        Build, explore, and preserve your family tree with photos, 
        relationships, and interactive visualizations.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="px-8 py-3 bg-gradient-to-r from-vine-500 to-vine-600 text-white rounded-lg font-semibold hover:from-vine-600 hover:to-vine-dark transition-all transform hover:scale-105 shadow-lg">
          Start Exploring
        </button>
        <button className="px-8 py-3 border-2 border-vine-200 text-vine-dark rounded-lg font-semibold hover:border-vine-300 hover:bg-vine-50 transition-all">
          Learn More
        </button>
      </div>
    </div>
  );
};

export default FamilyVineHero;