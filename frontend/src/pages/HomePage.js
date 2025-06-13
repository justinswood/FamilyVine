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

      {/* COMPACTED Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3"> {/* Reduced from py-4 to py-3 */}
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-1.5 tracking-tight"> {/* Reduced from mb-2 to mb-1.5 */}
            FamilyVine
          </h1>
          <p className="text-base mb-2.5 opacity-90"> {/* Reduced from mb-3 to mb-2.5 */}
            Connecting Generations Through Stories, Photos & Memories
          </p>
          <div className="flex flex-col sm:flex-row gap-1.5 justify-center"> {/* Reduced from gap-2 to gap-1.5 */}
            <Link
              to="/members"
              className="px-4 py-1.5 bg-white text-blue-600 rounded-full font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg text-sm"
            >
              Explore Your Tree
            </Link>
            <Link
              to="/add"
              className="px-4 py-1.5 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105 text-sm"
            >
              Add Family Member
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Showcase Section - COMPACTED */}
      <div className="max-w-7xl mx-auto px-4 py-5"> {/* Reduced from py-6 to py-5 */}
        <div className="text-center mb-3"> {/* Reduced from mb-4 to mb-3 */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1.5"> {/* Reduced from mb-2 to mb-1.5 */}
            Family Memories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm">
            Cherished moments and precious memories that tell the story of your family
          </p>
        </div>

        {/* Photo Grid - COMPACTED */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"> {/* Reduced from gap-4 to gap-3, mb-8 to mb-6 */}
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
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" // Reduced from h-48 to h-44
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1511895426328-dc8714aecd1f?w=600';
                      }}
                    />
                  </div>
                  {(photo.caption || photo.albumTitle) && (
                    <div className="p-3"> {/* Reduced from p-4 to p-3 */}
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
        <div className="text-center mb-6"> {/* Reduced from mb-8 to mb-6 */}
          <Link
            to="/gallery"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors" // Reduced from px-6 py-3 to px-5 py-2.5
          >
            View All Photos
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Stats Section - COMPACTED */}
      <div className="bg-white py-6"> {/* Reduced from py-8 to py-6 */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center"> {/* Reduced from gap-8 to gap-6 */}
            <div className="p-3"> {/* Reduced from p-4 to p-3 */}
              <div className="text-3xl font-bold text-blue-600 mb-1.5"> {/* Reduced from mb-2 to mb-1.5 */}
                {stats.totalMembers}
              </div>
              <p className="text-gray-600">Family Members</p>
            </div>
            <div className="p-3"> {/* Reduced from p-4 to p-3 */}
              <div className="text-3xl font-bold text-green-600 mb-1.5"> {/* Reduced from mb-2 to mb-1.5 */}
                {stats.totalAlbums}
              </div>
              <p className="text-gray-600">Photo Albums</p>
            </div>
            <div className="p-3"> {/* Reduced from p-4 to p-3 */}
              <div className="text-3xl font-bold text-purple-600 mb-1.5"> {/* Reduced from mb-2 to mb-1.5 */}
                {photosToShow.length}
              </div>
              <p className="text-gray-600">Recent Photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards - COMPACTED */}
      <div className="max-w-7xl mx-auto px-4 py-10"> {/* Reduced from py-12 to py-10 */}
        <div className="text-center mb-6"> {/* Reduced from mb-8 to mb-6 */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2.5"> {/* Reduced from mb-3 to mb-2.5 */}
            Explore FamilyVine
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover powerful tools to build, explore, and preserve your family legacy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"> {/* Reduced from gap-6 to gap-5 */}
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100" // Reduced from p-6 to p-5
            >
              <div className="text-center">
                <div className="text-4xl mb-2.5 transform group-hover:scale-110 transition-transform duration-300"> {/* Reduced from mb-3 to mb-2.5 */}
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2.5 group-hover:text-gray-900"> {/* Reduced from mb-3 to mb-2.5 */}
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-3 text-sm"> {/* Reduced from mb-4 to mb-3 */}
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

      {/* Recent Members Section - COMPACTED */}
      {!loading && stats.recentMembers.length > 0 && (
        <div className="bg-gray-50 py-10"> {/* Reduced from py-12 to py-10 */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-6"> {/* Reduced from mb-8 to mb-6 */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2.5"> {/* Reduced from mb-3 to mb-2.5 */}
                Recently Added
              </h2>
              <p className="text-gray-600">
                Welcome our newest family members to the tree
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5"> {/* Reduced from gap-6 to gap-5 */}
              {stats.recentMembers.map((member) => (
                <div key={member.id} className="bg-white p-4 rounded-lg shadow-md text-center"> {/* Reduced from p-5 to p-4 */}
                  <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2.5 flex items-center justify-center"> {/* Reduced from w-14 h-14 to w-12 h-12, mb-3 to mb-2.5 */}
                    <span className="text-lg font-bold text-blue-600"> {/* Reduced from text-xl to text-lg */}
                      {member.first_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1.5"> {/* Reduced from mb-2 to mb-1.5 */}
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

      {/* Footer - COMPACTED */}
      <footer className="bg-gray-800 text-white py-6"> {/* Reduced from py-8 to py-6 */}
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold mb-2.5">FamilyVine</h3> {/* Reduced from mb-3 to mb-2.5 */}
          <p className="text-gray-400 mb-3"> {/* Reduced from mb-4 to mb-3 */}
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