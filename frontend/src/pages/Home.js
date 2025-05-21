import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    membersWithPhotos: 0,
    totalRelationships: 0,
    totalAlbums: 0,
    recentMembers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeStats();
  }, []);

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

      // Sort members by creation date to get recent ones
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
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: "Family Tree Visualization",
      description: "Interactive D3.js family tree with drag-and-drop nodes and relationship mapping",
      icon: "🌳",
      link: "/visual-tree"
    },
    {
      title: "Photo Management",
      description: "Upload, crop, and organize family photos with smart tagging system",
      icon: "📸",
      link: "/gallery"
    },
    {
      title: "Geographic Mapping",
      description: "See where your family members live with interactive location maps",
      icon: "🗺️",
      link: "/map"
    },
    {
      title: "Relationship Tracking",
      description: "Document complex family relationships with bidirectional connections",
      icon: "👨‍👩‍👧‍👦",
      link: "/members"
    },
    {
      title: "Data Export",
      description: "Export your family tree in multiple formats including GEDCOM",
      icon: "📄",
      link: "/settings?tab=export"
    },
    {
      title: "Search & Filter",
      description: "Powerful search and filtering to quickly find any family member",
      icon: "🔍",
      link: "/members"
    }
  ];

  const getPhotoUrl = (member) => {
    if (!member.photo_url) {
      return 'https://via.placeholder.com/80x80/cccccc/666666?text=No+Photo';
    }
    
    if (member.photo_url.startsWith('http')) {
      return member.photo_url;
    }
    
    const cleanPath = member.photo_url.startsWith('/') 
      ? member.photo_url.substring(1) 
      : member.photo_url;
    
    return `${process.env.REACT_APP_API}/${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to FamilyVine</h1>
            <p className="text-lg md:text-xl mb-6 max-w-3xl mx-auto">
              FamilyVine helps you visually map and preserve your family's legacy. Add members, photos, life stories,
              and see how you're all connected—across generations and geography.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/members"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Family Tree
              </Link>
              <Link
                to="/add"
                className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors border border-green-500"
              >
                Add Family Member
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Members Section */}
      {!loading && stats.recentMembers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Recently Added Family Members</h2>
            <p className="text-lg text-gray-600">
              Newest additions to your family tree
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {stats.recentMembers.map((member) => (
              <Link
                key={member.id}
                to={`/members/${member.id}`}
                className="bg-white rounded-lg shadow p-4 text-center hover:shadow-lg transition-shadow"
              >
                <img
                  src={getPhotoUrl(member)}
                  alt={`${member.first_name} ${member.last_name}`}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
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
      )}

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Powerful Family Tree Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            FamilyVine provides all the tools you need to build, visualize, and preserve your family history
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow group"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.totalMembers}
              </div>
              <div className="text-gray-600 mt-1">Family Members</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.membersWithPhotos}
              </div>
              <div className="text-gray-600 mt-1">With Photos</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.totalRelationships}
              </div>
              <div className="text-gray-600 mt-1">Relationships</div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {stats.totalAlbums}
              </div>
              <div className="text-gray-600 mt-1">Photo Albums</div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action Section */}
      <div className="bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Start Building Your Family Legacy</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join families who trust FamilyVine to preserve their history and connect their generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/add"
                className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Add Your First Member
              </Link>
              <Link
                to="/import-csv"
                className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors border border-green-500"
              >
                Import Existing Data
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 FamilyVine. Built With Love by Justin Woods — For Those Before and Those Who Come After..
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;