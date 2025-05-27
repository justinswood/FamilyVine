import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProfileImage from '../components/ProfileImage';

const HomePage = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    membersWithPhotos: 0,
    totalRelationships: 0,
    totalAlbums: 0,
    recentMembers: []
  });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchHomeStats();
    fetchRecentPhotos();
  }, []);

  // Auto-rotate photos every 5 seconds
  useEffect(() => {
    if (recentPhotos.length > 1) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % recentPhotos.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [recentPhotos.length]);

  const fetchHomeStats = async () => {
    try {
      const [membersResponse, relationshipsResponse, albumsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API}/api/members`),
        axios.get(`${process.env.REACT_APP_API}/api/relationships`).catch(() => ({ data: [] })),
        axios.get(`${process.env.REACT_APP_API}/api/albums`).catch(() => ({ data: [] }))
      ]);

      const members = membersResponse.data;
      const relationships = relationshipsResponse.data;
      const albums = albumsResponse.data;

      const recentMembers = members
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);

      setStats({
        totalMembers: members.length,
        membersWithPhotos: members.filter(m => m.photo_url).length,
        totalRelationships: relationships.length,
        totalAlbums: albums.length,
        recentMembers
      });
    } catch (error) {
      console.error('Error fetching home stats:', error);
    }
  };

  const fetchRecentPhotos = async () => {
    try {
      // First, try to load selected hero images
      const savedHeroImages = localStorage.getItem('familyVine_heroImages');
      
      if (savedHeroImages) {
        try {
          const heroImages = JSON.parse(savedHeroImages);
          if (heroImages && heroImages.length > 0) {
            setRecentPhotos(heroImages);
            return; // Use selected images and exit early
          }
        } catch (error) {
          console.error('Error loading hero images:', error);
        }
      }
      
      // Fallback: If no hero images selected, use the original logic
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
        setRecentPhotos(allPhotos.slice(0, 5));
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
    },
    {
      title: "Data Export",
      description: "Export your family tree in multiple formats including GEDCOM",
      icon: "📄",
      color: "from-indigo-500 to-blue-600",
      link: "/settings?tab=export"
    },
    {
      title: "Search & Filter",
      description: "Quickly find any family member with powerful search and filtering",
      icon: "🔍",
      color: "from-teal-500 to-emerald-600",
      link: "/members"
    }
  ];

  // Default photos if no real photos are available
  const defaultPhotos = [
    { id: 1, file_path: 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=800', caption: 'Family Moments' },
    { id: 2, file_path: 'https://images.unsplash.com/photo-1544968503-f06c29d5ee4d?w=800', caption: 'Cherished Memories' },
    { id: 3, file_path: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?w=800', caption: 'Special Occasions' }
  ];

  const photosToShow = recentPhotos.length > 0 ? recentPhotos : defaultPhotos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section with Photos */}
      <div className="relative overflow-hidden">
        {/* Background Photo Slideshow */}
        <div className="absolute inset-0 h-screen">
          {photosToShow.map((photo, index) => (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentPhotoIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={photo.file_path?.startsWith('http') ? photo.file_path : `${process.env.REACT_APP_API}/${photo.file_path}`}
                alt={photo.caption || photo.albumTitle || 'Family photo'}
                className="w-full h-full object-cover object-top"
				style={{ objectPosition: '50% 20%' }}
                onError={(e) => {
                  // Fallback to default image if photo fails to load
                  e.target.src = 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=800';
                }}
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex items-start justify-center h-screen pt-4">
          <div className="text-center text-white px-4">
            {/* Main Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                FamilyVine
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-base md:text-lg mb-4 font-light max-w-xl mx-auto leading-relaxed">
              Connecting Generations Through Stories, Photos & Memories
            </p>
            
            {/* Call-to-Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-6">
              <Link
                to="/members"
                className="px-4 py-2 bg-white text-gray-900 rounded-full font-semibold text-sm hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
              >
                Explore Your Tree
              </Link>
              <Link
                to="/add"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-sm hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl border-2 border-white/20"
              >
                Add Family Member
              </Link>
            </div>

            {/* Photo Navigation Dots */}
            {photosToShow.length > 1 && (
              <div className="flex justify-center space-x-2">
                {photosToShow.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'bg-white scale-125'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Preserve Your Legacy
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools to build, visualize, and share your family history
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                {/* Card Content */}
                <div className="relative p-8">
                  {/* Icon */}
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  {/* CTA Arrow */}
                  <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                    <span className="mr-2">Explore</span>
                    <svg 
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Decorative Border */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Members Section */}
      {!loading && stats.recentMembers.length > 0 && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Recent Family Members</h2>
              <p className="text-lg text-gray-600">
                Newest additions to your family tree
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {stats.recentMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/members/${member.id}`}
                  className="bg-gray-50 rounded-xl shadow-md p-4 text-center hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <ProfileImage 
                    member={member} 
                    size="small" 
                    className="mx-auto mb-3" 
                  />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {member.location || 'Location not specified'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">{stats.totalMembers}</div>
              <div className="text-blue-100">Family Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.membersWithPhotos}</div>
              <div className="text-blue-100">With Photos</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.totalRelationships}</div>
              <div className="text-blue-100">Relationships</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.totalAlbums}</div>
              <div className="text-blue-100">Photo Albums</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Start Preserving Your Family Legacy Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join families worldwide who trust FamilyVine to keep their stories alive for future generations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/add"
              className="px-10 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full text-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-xl"
            >
              Add Your First Member
            </Link>
            <Link
              to="/settings?tab=import"
              className="px-10 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-full text-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-105 shadow-xl"
            >
              Import Existing Data
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 FamilyVine. Built With Love by Justin Woods — For Those Before and Those Who Come After.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;