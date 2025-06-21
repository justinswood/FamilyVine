import React from 'react';

const VineLogoCompact = () => {
  return (
    <div className="flex items-center gap-2">
      {/* Animated Vine SVG - Compact Version */}
      <svg
        width="40"
        height="30"
        viewBox="0 0 40 30"
        className="overflow-visible"
      >
        {/* Main vine branch */}
        <path
          d="M 2 15 Q 10 8, 20 12 Q 30 16, 38 10"
          stroke="#22c55e"
          strokeWidth="2"
          fill="none"
          style={{
            strokeDasharray: '50',
            strokeDashoffset: '50',
            animation: 'drawVine 2s ease-out forwards'
          }}
        />

        {/* Vine leaves */}
        <g style={{ animation: 'fadeInSway 0.4s ease-out 1s forwards, sway 3s ease-in-out 1.5s infinite', opacity: 0 }}>
          <ellipse cx="12" cy="10" rx="3" ry="5" fill="#16a34a" opacity="0.8" transform="rotate(-20 12 10)" />
          <line x1="12" y1="10" x2="12" y2="13" stroke="#15803d" strokeWidth="0.8" />
        </g>

        <g style={{ animation: 'fadeInSway 0.4s ease-out 1.3s forwards, sway 3s ease-in-out 2s infinite', opacity: 0 }}>
          <ellipse cx="25" cy="13" rx="2.5" ry="4" fill="#22c55e" opacity="0.9" transform="rotate(15 25 13)" />
          <line x1="25" y1="13" x2="25" y2="16" stroke="#15803d" strokeWidth="0.8" />
        </g>

        <circle cx="18" cy="18" r="1" fill="#22c55e" opacity="0.6" className="animate-pulse" style={{ animationDelay: '2s' }} />
      </svg>

      {/* FamilyVine Text */}
      <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
        FamilyVine
      </span>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes drawVine {
          from {
            stroke-dashoffset: 50;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes sway {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          25% {
            transform: rotate(1deg) scale(1.02);
          }
          75% {
            transform: rotate(-1deg) scale(0.98);
          }
        }
        
        @keyframes fadeInSway {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default VineLogoCompact;