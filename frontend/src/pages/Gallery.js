import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Gallery = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    event_date: '',
    is_public: true
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      setAlbums(response.data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API}/api/albums`, newAlbum);
      setNewAlbum({ title: '', description: '', event_date: '', is_public: true });
      setShowCreateForm(false);
      fetchAlbums();
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAlbum(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading photo albums...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gallery-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M8,8 L32,8 L32,32 L8,32 Z M12,12 L28,12 L28,28 L12,28 Z M16,16 L24,16 L24,24 L16,24 Z"
                stroke="currentColor" strokeWidth="0.5" className="text-blue-200" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gallery-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-5 -left-5 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-lg"></div>
        <div className="absolute -top-10 -right-10 w-30 h-30 bg-gradient-to-bl from-blue-200/20 to-cyan-200/20 rounded-full blur-lg"></div>
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gradient-to-t from-purple-200/20 to-pink-200/20 rounded-full blur-lg"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto p-4">

        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-4 mb-6 border border-white/50">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Photo Gallery
                </h1>
                <p className="text-gray-600">Organize and share your family memories</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg font-medium"
            >
              <span className="text-lg">📷</span>
              Create Album
            </button>
          </div>
        </div>

        {/* Create Album Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl max-w-md w-full shadow-2xl border border-white/50">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Create New Album
              </h2>
              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Album Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newAlbum.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={newAlbum.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Event Date (optional)</label>
                  <input
                    type="date"
                    name="event_date"
                    value={newAlbum.event_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={newAlbum.is_public}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label className="text-sm text-gray-700">Make album public</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg font-medium"
                  >
                    Create Album
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white px-4 py-2 rounded-lg hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all shadow-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/50 max-w-md mx-auto">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Albums Yet</h3>
              <p className="text-gray-600 mb-4">Create your first album to start organizing your family photos!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-lg font-medium"
              >
                Create First Album
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album, index) => {
              // Create unique gradient combinations for each album
              const gradients = [
                'from-pink-400 via-purple-400 to-indigo-500',
                'from-blue-400 via-cyan-400 to-teal-500', 
                'from-green-400 via-emerald-400 to-blue-500',
                'from-yellow-400 via-orange-400 to-red-500',
                'from-purple-400 via-pink-400 to-rose-500',
                'from-indigo-400 via-blue-400 to-cyan-500',
                'from-emerald-400 via-green-400 to-lime-500',
                'from-rose-400 via-pink-400 to-purple-500',
                'from-cyan-400 via-blue-400 to-indigo-500',
                'from-orange-400 via-red-400 to-pink-500'
              ];
              
              const borderGradients = [
                'from-pink-500 to-indigo-600',
                'from-blue-500 to-teal-600',
                'from-green-500 to-blue-600', 
                'from-yellow-500 to-red-600',
                'from-purple-500 to-rose-600',
                'from-indigo-500 to-cyan-600',
                'from-emerald-500 to-lime-600',
                'from-rose-500 to-purple-600',
                'from-cyan-500 to-indigo-600',
                'from-orange-500 to-pink-600'
              ];

              const albumGradient = gradients[index % gradients.length];
              const albumBorder = borderGradients[index % borderGradients.length];

              return (
                <Link
                  key={album.id}
                  to={`/gallery/${album.id}`}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 hover:rotate-1"
                >
                  {/* Animated border gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${albumBorder} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl p-0.5`}>
                    <div className="bg-white rounded-2xl h-full w-full"></div>
                  </div>
                  
                  {/* Content container */}
                  <div className="relative z-10">
                    {/* Image/thumbnail section with gradient overlay */}
                    <div className="relative aspect-w-4 aspect-h-3">
                      {album.cover_photo_path ? (
                        <>
                          <img
                            src={`${process.env.REACT_APP_API}/${album.cover_photo_path}`}
                            alt={album.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500 rounded-t-2xl"
                          />
                          {/* Gradient overlay on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-t ${albumGradient} opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-t-2xl`}></div>
                        </>
                      ) : (
                        <div className={`flex items-center justify-center h-48 bg-gradient-to-br ${albumGradient} rounded-t-2xl relative overflow-hidden`}>
                          {/* Animated background pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/30 rounded-full animate-bounce delay-100"></div>
                            <div className="absolute top-8 right-8 w-6 h-6 bg-white/20 rounded-full animate-bounce delay-300"></div>
                            <div className="absolute bottom-6 left-1/3 w-4 h-4 bg-white/25 rounded-full animate-bounce delay-500"></div>
                          </div>
                          {/* Camera icon with animation */}
                          <div className="relative">
                            <svg className="w-20 h-20 text-white/80 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {/* Pulse effect */}
                            <div className="absolute inset-0 bg-white/20 rounded-full group-hover:animate-ping"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Photo count badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {album.photo_count || 0}
                      </div>
                    </div>

                    {/* Content section */}
                    <div className="p-5">
                      <h3 className="font-bold text-xl mb-2 text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                        {album.title}
                      </h3>
                      
                      {album.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{album.description}</p>
                      )}
                      
                      {/* Footer with enhanced styling */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${albumGradient} animate-pulse`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {album.photo_count || 0} photos
                          </span>
                        </div>
                        
                        {album.event_date && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full font-medium">
                            {new Date(album.event_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-r ${albumGradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10`}></div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;