// VineAnimation.js - Create this file in your src/components folder
import React from 'react';

const VineAnimation = ({ side = 'left', className = '' }) => {
    // Different vine paths for left and right sides
    const isLeft = side === 'left';

    return (
        <div className={`vine-container ${className}`}>
            <svg
                width="150"
                height="80"
                viewBox="0 0 150 80"
                className="overflow-visible"
            >
                {/* Main vine branch */}
                <path
                    d={isLeft
                        ? "M 0 40 Q 30 20, 60 35 Q 90 45, 120 30 Q 140 25, 150 35"
                        : "M 150 40 Q 120 20, 90 35 Q 60 45, 30 30 Q 10 25, 0 35"
                    }
                    stroke="#22c55e"
                    strokeWidth="3"
                    fill="none"
                    className="vine-main animate-grow"
                    style={{
                        strokeDasharray: '200',
                        strokeDashoffset: '200',
                        animation: 'drawVine 3s ease-out forwards'
                    }}
                />

                {/* Vine leaves - Left side */}
                {isLeft ? (
                    <>
                        <g className="leaf animate-sway" style={{ animationDelay: '1s' }}>
                            <ellipse cx="25" cy="30" rx="8" ry="12" fill="#16a34a" opacity="0.8" transform="rotate(-20 25 30)" />
                            <line x1="25" y1="30" x2="25" y2="35" stroke="#15803d" strokeWidth="1" />
                        </g>

                        <g className="leaf animate-sway" style={{ animationDelay: '1.5s' }}>
                            <ellipse cx="65" cy="38" rx="6" ry="10" fill="#22c55e" opacity="0.9" transform="rotate(15 65 38)" />
                            <line x1="65" y1="38" x2="65" y2="42" stroke="#15803d" strokeWidth="1" />
                        </g>

                        <g className="leaf animate-sway" style={{ animationDelay: '2s' }}>
                            <ellipse cx="110" cy="25" rx="7" ry="11" fill="#16a34a" opacity="0.8" transform="rotate(-30 110 25)" />
                            <line x1="110" y1="25" x2="110" y2="30" stroke="#15803d" strokeWidth="1" />
                        </g>
                    </>
                ) : (
                    <>
                        {/* Vine leaves - Right side (mirrored) */}
                        <g className="leaf animate-sway" style={{ animationDelay: '1s' }}>
                            <ellipse cx="125" cy="30" rx="8" ry="12" fill="#16a34a" opacity="0.8" transform="rotate(20 125 30)" />
                            <line x1="125" y1="30" x2="125" y2="35" stroke="#15803d" strokeWidth="1" />
                        </g>

                        <g className="leaf animate-sway" style={{ animationDelay: '1.5s' }}>
                            <ellipse cx="85" cy="38" rx="6" ry="10" fill="#22c55e" opacity="0.9" transform="rotate(-15 85 38)" />
                            <line x1="85" y1="38" x2="85" y2="42" stroke="#15803d" strokeWidth="1" />
                        </g>

                        <g className="leaf animate-sway" style={{ animationDelay: '2s' }}>
                            <ellipse cx="40" cy="25" rx="7" ry="11" fill="#16a34a" opacity="0.8" transform="rotate(30 40 25)" />
                            <line x1="40" y1="25" x2="40" y2="30" stroke="#15803d" strokeWidth="1" />
                        </g>
                    </>
                )}

                {/* Small decorative elements */}
                <circle cx={isLeft ? "45" : "105"} cy="45" r="2" fill="#22c55e" opacity="0.6" className="animate-pulse" style={{ animationDelay: '2.5s' }} />
                <circle cx={isLeft ? "85" : "65"} cy="20" r="1.5" fill="#16a34a" opacity="0.7" className="animate-pulse" style={{ animationDelay: '3s' }} />
            </svg>

            <style jsx>{`
        @keyframes drawVine {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes sway {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }
        
        .animate-grow {
          animation: drawVine 3s ease-out forwards;
        }
        
        .animate-sway {
          animation: sway 4s ease-in-out infinite;
          transform-origin: center bottom;
        }
        
        .leaf {
          opacity: 0;
          animation: fadeInSway 0.5s ease-out forwards, sway 4s ease-in-out infinite;
        }
        
        @keyframes fadeInSway {
          to {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
};

export default VineAnimation;