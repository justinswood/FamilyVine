import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './HomePage.css'; // Make sure to create this file with the CSS styles below

const HeroSection = () => {
  return (
    <div className="hero-section relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-2xl shadow-lg mb-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <pattern id="family-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#family-pattern)" />
        </svg>
      </div>
      
      <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left Column - Text Content */}
          <div className="w-full md:w-1/2 mb-12 md:mb-0 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
              <span className="text-blue-600">Family</span>Vine
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 font-light">
              Connecting Generations, Preserving Stories
            </p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
              Explore your family history, discover connections, and preserve precious memories for generations to come.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link 
                to="/tree" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 shadow-md hover:shadow-lg"
              >
                Explore Tree
              </Link>
              <Link 
                to="/gallery" 
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition duration-300 border border-blue-600 shadow-md hover:shadow-lg"
              >
                View Photos
              </Link>
            </div>
          </div>
          
          {/* Right Column - Family Tree Visualization */}
          <div className="w-full md:w-1/2 relative">
            <div className="family-tree-visualization relative h-64 md:h-80 w-full">
              {/* Animated Tree Nodes */}
              <div className="absolute top-1/4 left-1/4 w-12 h-12 rounded-full bg-blue-100 border-4 border-blue-500 shadow-lg animate-pulse"></div>
              <div className="absolute top-1/3 right-1/3 w-10 h-10 rounded-full bg-green-100 border-4 border-green-500 shadow-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-1/4 left-1/3 w-10 h-10 rounded-full bg-amber-100 border-4 border-amber-500 shadow-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/3 right-1/4 w-8 h-8 rounded-full bg-purple-100 border-4 border-purple-500 shadow-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute bottom-1/2 left-1/2 w-14 h-14 rounded-full bg-red-100 border-4 border-red-500 shadow-lg animate-pulse" style={{ animationDelay: '0.7s' }}></div>
              
              {/* Connection Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <line x1="30%" y1="25%" x2="40%" y2="50%" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" className="animate-draw" />
                <line x1="40%" y1="50%" x2="33%" y2="75%" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" className="animate-draw" style={{ animationDelay: '0.5s' }} />
                <line x1="40%" y1="50%" x2="70%" y2="33%" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" className="animate-draw" style={{ animationDelay: '1s' }} />
                <line x1="70%" y1="33%" x2="75%" y2="67%" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5,5" className="animate-draw" style={{ animationDelay: '1.5s' }} />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCards = () => {
  // Feature card data
  const features = [
    {
      title: "Family Tree",
      description: "Explore your roots with interactive family connections.",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      ),
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      link: "/tree"
    },
    {
      title: "Photo Gallery",
      description: "Preserve and share memorable moments with loved ones.",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      link: "/gallery"
    },
    {
      title: "Family Map",
      description: "See where family members are located around the world.",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      link: "/map"
    },
    {
      title: "Family Stories",
      description: "Share and preserve family stories for future generations.",
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      ),
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
      link: "/stories"
    }
  ];

  return (
    <div className="feature-cards mb-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Explore Your Family Heritage</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index}
            className={`feature-card relative rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${feature.bgColor} border ${feature.borderColor}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-white opacity-20"></div>
            
            <div className="p-6">
              <div className={`icon-circle w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feature.iconColor} bg-white shadow-md`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 mb-4 text-sm">{feature.description}</p>
              
              <Link 
                to={feature.link}
                className={`inline-flex items-center font-medium hover:underline ${feature.iconColor}`}
              >
                Explore
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PhotoCarousel = ({ photos }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);
  
  // Rotate through photos every 5 seconds
  useEffect(() => {
    if (photos && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNextSlide();
      }, 5000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [photos, activeIndex]);
  
  // Go to next slide with transition
  const goToNextSlide = () => {
    if (isTransitioning || !photos || photos.length <= 1) return;
    
    setIsTransitioning(true);
    const nextIndex = (activeIndex + 1) % photos.length;
    setActiveIndex(nextIndex);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700); // Match with CSS transition duration
  };
  
  // Go to previous slide with transition
  const goToPrevSlide = () => {
    if (isTransitioning || !photos || photos.length <= 1) return;
    
    setIsTransitioning(true);
    const prevIndex = (activeIndex - 1 + photos.length) % photos.length;
    setActiveIndex(prevIndex);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 700); // Match with CSS transition duration
  };
  
  // Pause autoplay on hover
  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  
  // Resume autoplay on mouse leave
  const handleMouseLeave = () => {
    if (photos && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNextSlide();
      }, 5000);
    }
  };
  
  if (!photos || photos.length === 0) {
    return (
      <div className="recent-photos-placeholder bg-gray-100 rounded-xl p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <h3 className="text-lg font-medium text-gray-600">No recent photos</h3>
        <p className="text-gray-500 mt-2">Upload photos to see them displayed here.</p>
        <Link to="/gallery" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Go to Gallery
        </Link>
      </div>
    );
  }
  
  return (
    <div className="recent-photos mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Recent Photos</h2>
        <Link to="/gallery" className="text-blue-600 hover:underline flex items-center">
          View All
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Link>
      </div>
      
      <div 
        className="photo-carousel relative h-80 md:h-96 overflow-hidden rounded-xl shadow-xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Photo Slides with Ken Burns effect */}
        {photos.map((photo, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-in-out ${
                index === activeIndex ? 'scale-110' : 'scale-100'
              }`}
              style={{
                backgroundImage: `url(${process.env.REACT_APP_API}/${photo.file_path})`,
                transformOrigin: index % 2 === 0 ? 'top left' : 'bottom right'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2 text-shadow">
                  {photo.caption || 'Family Moment'}
                </h3>
                <p className="opacity-80 text-shadow-sm">
                  {photo.taken_date 
                    ? new Date(photo.taken_date).toLocaleDateString()
                    : 'A cherished memory'
                  }
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button 
              onClick={goToPrevSlide} 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button 
              onClick={goToNextSlide} 
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </>
        )}
        
        {/* Dot Indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => {
                  if (!isTransitioning) {
                    setActiveIndex(index);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main HomePage component
const HomePage = () => {
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch recent photos for the carousel
    const fetchRecentPhotos = async () => {
      try {
        // Fetch data from all albums to get recent photos
        const response = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
        const albums = response.data;
        
        // Get latest album with photos
        if (albums.length > 0) {
          // Get photos from the most recent album
          const latestAlbum = albums[0]; // Assuming albums are sorted by date
          const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums/${latestAlbum.id}`);
          
          if (albumResponse.data.photos && albumResponse.data.photos.length > 0) {
            // Get the 5 most recent photos
            const recentPhotos = albumResponse.data.photos.slice(0, 5);
            setRecentPhotos(recentPhotos);
          }
        }
      } catch (err) {
        console.error("Error fetching photos:", err);
        setError("Failed to load recent photos");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentPhotos();
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Cards */}
      <FeatureCards />
      
      {/* Photo Carousel */}
      <PhotoCarousel photos={recentPhotos} />
      
      {/* Footer with attribution */}
      <footer className="text-center py-8 mt-16 border-t border-gray-200">
        <p className="text-gray-600">
          Built With Love by Justin Woods
        </p>
        <p className="text-sm text-gray-500 mt-2">
          © {new Date().getFullYear()} - For Those Before and Those Who Come After..
        </p>
      </footer>
    </div>
  );
};

export default HomePage;