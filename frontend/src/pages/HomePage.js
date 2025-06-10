import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAlbums: 0,
    recentMembers: []
  });

  useEffect(() => {
    fetchHomeStats();
    fetchRecentPhotos();
  }, []);

  const fetchHomeStats = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      const members = response.data;
      const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      const albums = albumResponse.data;

      // Get 3 most recent members
      const recentMembers = members
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);

      setStats({
        totalMembers: members.length,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Compact Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            FamilyVine
          </h1>
          <p className="text-xl mb-6 opacity-90">
            Connecting Generations Through Stories, Photos & Memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/members"
              className="px-6 py-3 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Explore Your Tree
            </Link>
            <Link
              to="/add"
              className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
            >
              Add Family Member
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Showcase Section - This is the main change! */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Family Memories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Cherished moments and precious memories that tell the story of your family
          </p>
        </div>

        {/* Photo Grid - Photos at natural size */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {photosToShow.slice(0, 6).map((photo, index) => (
              <div key={photo.id || index} className="group cursor-pointer">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="aspect-w-4 aspect-h-3 bg-gray-200">
                    <img
                      src={photo.file_path?.startsWith('http') ?
                        photo.file_path :
                        `${process.env.REACT_APP_API}/${photo.file_path}`
                      }
                      alt={photo.caption || photo.albumTitle || 'Family photo'}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=600';
                      }}
                    />
                  </div>
                  {(photo.caption || photo.albumTitle) && (
                    <div className="p-4">
                      <p className="text-gray-700 font-medium">
                        {photo.caption || photo.albumTitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View More Photos Button */}
        <div className="text-center mb-16">
          <Link
            to="/gallery"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            View All Photos
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {stats.totalMembers}
              </div>
              <p className="text-gray-600">Family Members</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.totalAlbums}
              </div>
              <p className="text-gray-600">Photo Albums</p>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {photosToShow.length}
              </div>
              <p className="text-gray-600">Recent Photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Explore FamilyVine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover powerful tools to build, explore, and preserve your family legacy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                <div className="flex items-center justify-center text-blue-600 font-semibold group-hover:text-blue-700">
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
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Members Section */}
      {!loading && stats.recentMembers.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Recently Added
              </h2>
              <p className="text-gray-600">
                Welcome our newest family members to the tree
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.recentMembers.map((member) => (
                <div key={member.id} className="bg-white p-6 rounded-lg shadow-md text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {member.first_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {member.first_name} {member.last_name}
                  </h3>
                  {member.birth_year && (
                    <p className="text-gray-600">
                      Born {member.birth_year}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">FamilyVine</h3>
          <p className="text-gray-400 mb-6">
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