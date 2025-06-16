import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Github } from 'lucide-react';

// Vine Animation Component (inline for simplicity)
const VineAnimation = ({ side = 'left', className = '' }) => {
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
          className="vine-main"
          style={{
            strokeDasharray: '200',
            strokeDashoffset: '200',
            animation: 'drawVine 3s ease-out forwards'
          }}
        />

        {/* Vine leaves - Left side */}
        {isLeft ? (
          <>
            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 1s forwards, sway 4s ease-in-out 1.5s infinite', opacity: 0 }}>
              <ellipse cx="25" cy="30" rx="8" ry="12" fill="#16a34a" opacity="0.8" transform="rotate(-20 25 30)" />
              <line x1="25" y1="30" x2="25" y2="35" stroke="#15803d" strokeWidth="1" />
            </g>

            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 1.5s forwards, sway 4s ease-in-out 2s infinite', opacity: 0 }}>
              <ellipse cx="65" cy="38" rx="6" ry="10" fill="#22c55e" opacity="0.9" transform="rotate(15 65 38)" />
              <line x1="65" y1="38" x2="65" y2="42" stroke="#15803d" strokeWidth="1" />
            </g>

            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 2s forwards, sway 4s ease-in-out 2.5s infinite', opacity: 0 }}>
              <ellipse cx="110" cy="25" rx="7" ry="11" fill="#16a34a" opacity="0.8" transform="rotate(-30 110 25)" />
              <line x1="110" y1="25" x2="110" y2="30" stroke="#15803d" strokeWidth="1" />
            </g>
          </>
        ) : (
          <>
            {/* Vine leaves - Right side (mirrored) */}
            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 1s forwards, sway 4s ease-in-out 1.5s infinite', opacity: 0 }}>
              <ellipse cx="125" cy="30" rx="8" ry="12" fill="#16a34a" opacity="0.8" transform="rotate(20 125 30)" />
              <line x1="125" y1="30" x2="125" y2="35" stroke="#15803d" strokeWidth="1" />
            </g>

            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 1.5s forwards, sway 4s ease-in-out 2s infinite', opacity: 0 }}>
              <ellipse cx="85" cy="38" rx="6" ry="10" fill="#22c55e" opacity="0.9" transform="rotate(-15 85 38)" />
              <line x1="85" y1="38" x2="85" y2="42" stroke="#15803d" strokeWidth="1" />
            </g>

            <g className="leaf" style={{ animation: 'fadeInSway 0.5s ease-out 2s forwards, sway 4s ease-in-out 2.5s infinite', opacity: 0 }}>
              <ellipse cx="40" cy="25" rx="7" ry="11" fill="#16a34a" opacity="0.8" transform="rotate(30 40 25)" />
              <line x1="40" y1="25" x2="40" y2="30" stroke="#15803d" strokeWidth="1" />
            </g>
          </>
        )}

        {/* Small decorative elements */}
        <circle cx={isLeft ? "45" : "105"} cy="45" r="2" fill="#22c55e" opacity="0.6" className="animate-pulse" style={{ animationDelay: '2.5s' }} />
        <circle cx={isLeft ? "85" : "65"} cy="20" r="1.5" fill="#16a34a" opacity="0.7" className="animate-pulse" style={{ animationDelay: '3s' }} />
      </svg>
    </div>
  );
};

const HomePage = () => {
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentPhotos();
  }, []);

  const fetchRecentPhotos = async () => {
    try {
      // First, try to load selected hero images
      const savedHeroImages = localStorage.getItem('familyVine_heroImages');

      if (savedHeroImages) {
        try {
          const heroImages = JSON.parse(savedHeroImages);
          if (heroImages && heroImages.length > 0) {
            setRecentPhotos(heroImages);
            return;
          }
        } catch (error) {
          console.error('Error loading hero images:', error);
        }
      }

      // Fallback: get photos from albums
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      const albums = response.data;

      if (albums.length > 0) {
        const allPhotos = [];
        for (const album of albums.slice(0, 3)) {
          try {
            const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums/${album.id}`);
            if (albumResponse.data.photos && albumResponse.data.photos.length > 0) {
              allPhotos.push(...albumResponse.data.photos.slice(0, 2).map(photo => ({
                ...photo,
                albumTitle: album.title
              })));
            }
          } catch (err) {
            console.error(`Error fetching album ${album.id}:`, err);
          }
        }
        setRecentPhotos(allPhotos.slice(0, 6));
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Interactive Family Tree",
      description: "Visualize your family connections with our beautiful, interactive tree view",
      icon: "🌳",
      color: "from-emerald-500 to-green-600",
      link: "/visual-tree"
    },
    {
      title: "Photo Gallery",
      description: "Upload, organize, and tag family photos with advanced face recognition",
      icon: "📸",
      color: "from-blue-500 to-cyan-600",
      link: "/gallery"
    },
    {
      title: "Family Map",
      description: "See where your family members live around the world on an interactive map",
      icon: "🗺️",
      color: "from-orange-500 to-red-500",
      link: "/map"
    },
    {
      title: "Timeline View",
      description: "Explore your family history through an interactive timeline of events",
      icon: "📅",
      color: "from-purple-500 to-pink-500",
      link: "/timeline"
    }
  ];

  // Default photos if no real photos are available
  const defaultPhotos = [
    { id: 1, file_path: 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=600', caption: 'Family Moments' },
    { id: 2, file_path: 'https://images.unsplash.com/photo-1544968503-f06c29d5ee4d?w=600', caption: 'Cherished Memories' },
    { id: 3, file_path: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=600', caption: 'Special Occasions' }
  ];

  const photosToShow = recentPhotos.length > 0 ? recentPhotos : defaultPhotos;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background pattern - Same as AddMember page */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="homepage-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M25,10 L25,40 M10,25 L40,25" stroke="currentColor" strokeWidth="1" className="text-blue-200" />
              <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-200" />
              <path d="M20,20 L30,30 M30,20 L20,30" stroke="currentColor" strokeWidth="0.5" className="text-pink-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#homepage-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements - Same as AddMember page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-200/30 to-cyan-200/30 rounded-full blur-xl"></div>
        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-80 h-40 bg-gradient-to-t from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
      </div>
      {/* Inline Styles for Vine Animation */}
      <style jsx>{`
        @keyframes drawVine {
          from {
            stroke-dashoffset: 200;
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
            transform: rotate(2deg) scale(1.02);
          }
          75% {
            transform: rotate(-2deg) scale(0.98);
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
        
        .vine-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.3));
        }
        
        .vine-left {
          position: absolute;
          left: -120px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        
        .vine-right {
          position: absolute;
          right: -120px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .vine-left,
          .vine-right {
            display: none;
          }
        }
      `}</style>

      {/* Updated Header Section with Textured Background */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 relative overflow-hidden z-20">
        {/* GitHub Link in Top Right Corner */}
        <div className="absolute top-4 right-4 z-20">
          <a
            href="https://github.com/justinswood/FamilyVine"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
            title="View on GitHub"
          >
            <Github className="w-5 h-5 text-white" />
          </a>
        </div>
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="header-texture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                {/* Diamond/rhombus pattern for raised texture effect */}
                <path d="M10,2 L18,10 L10,18 L2,10 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                <path d="M10,5 L15,10 L10,15 L5,10 Z" fill="rgba(255,255,255,0.03)" />
                {/* Small dots for additional texture */}
                <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.04)" />
                <circle cx="5" cy="5" r="0.5" fill="rgba(255,255,255,0.02)" />
                <circle cx="15" cy="15" r="0.5" fill="rgba(255,255,255,0.02)" />
              </pattern>

              {/* Light emboss effect pattern */}
              <pattern id="emboss-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="40" height="40" fill="none" />
                <path d="M0,20 Q10,10 20,20 Q30,30 40,20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" fill="none" />
                <path d="M0,25 Q10,15 20,25 Q30,35 40,25" stroke="rgba(0,0,0,0.02)" strokeWidth="1" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#header-texture)" />
            <rect width="100%" height="100%" fill="url(#emboss-pattern)" />
          </svg>
        </div>

        {/* Subtle light reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/5"></div>

        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0" style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)'
        }}></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          {/* Title with Vine Decorations */}
          <div className="relative inline-block mb-1.5">
            {/* Left Vine */}
            <div className="vine-left hidden md:block">
              <VineAnimation side="left" />
            </div>

            {/* Main Title with subtle text shadow for raised effect */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight relative z-10"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              <span className="text-white">Family</span>
              <span className="text-green-300">Vine</span>
            </h1>

            {/* Right Vine */}
            <div className="vine-right hidden md:block">
              <VineAnimation side="right" />
            </div>
          </div>

          <p className="text-base mb-2.5 opacity-90"
            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
            Connecting Generations Through Stories, Photos & Memories
          </p>
          <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
            <Link
              to="/members"
              className="px-4 py-1.5 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg text-sm"
              style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3)' }}
            >
              Explore Your Tree
            </Link>
            <Link
              to="/add"
              className="px-4 py-1.5 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 text-sm"
              style={{
                textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              Add Family Member
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Showcase Section - COMPACTED */}
      <div className="max-w-7xl mx-auto px-4 py-5 relative z-10">
        <div className="text-center mb-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1.5">
            Family Memories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
            Cherished moments and precious memories that tell the story of your family
          </p>
        </div>

        {/* Photo Grid - COMPACTED */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {photosToShow.slice(0, 6).map((photo, index) => (
              <div key={photo.id || index} className="group cursor-pointer">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
                    <img
                      src={photo.file_path?.startsWith('http') ?
                        photo.file_path :
                        `${process.env.REACT_APP_API}/${photo.file_path}`
                      }
                      alt={photo.caption || photo.albumTitle || 'Family photo'}
                      className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=600';
                      }}
                    />
                  </div>
                  {(photo.caption || photo.albumTitle) && (
                    <div className="p-3">
                      <p className="text-gray-700 font-medium">
                        {photo.albumTitle}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}

        {/* View More Photos Button - COMPACTED */}
        <div className="text-center mb-6">
          <Link
            to="/gallery"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            View All Photos
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>



      {/* Feature Cards - COMPACTED */}
      <div className="max-w-7xl mx-auto px-4 py-10 relative z-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2.5">
            Explore FamilyVine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover powerful tools to build, explore, and preserve your family legacy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-4xl mb-2.5 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2.5 group-hover:text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3 text-sm">
                  {feature.description}
                </p>
                <div className="flex items-center justify-center text-blue-600 font-semibold group-hover:text-blue-700">
                  <span className="mr-2">Explore</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </Link>
          ))}
        </div>
      </div>



      {/* Footer - COMPACTED */}
      <footer className="bg-gray-800/90 backdrop-blur-sm text-white py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2.5">FamilyVine</h3>
          <p className="text-gray-400 mb-3">
            Built With Love by Justin Woods
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} - For Those Before and Those Who Come After
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;