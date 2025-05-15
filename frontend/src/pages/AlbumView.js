import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PhotoTagger from '../components/PhotoTagger';

const AlbumView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTagger, setShowTagger] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // New state for photo modal
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  useEffect(() => {
    fetchAlbum();
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums/${id}`);
      setAlbum(response.data);
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    selectedFiles.forEach((file) => {
      formData.append('photos', file);
    });

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/albums/${id}/photos`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setSelectedFiles([]);
      setShowUploadForm(false);
      setUploadProgress(0);
      fetchAlbum(); // Refresh album data
    } catch (error) {
      console.error('Error uploading photos:', error);
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/albums/${id}/photos/${photoId}`);
      fetchAlbum(); // Refresh album data
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const deleteAlbum = async () => {
    const photoCount = album.photos ? album.photos.length : 0;
    const confirmMessage = photoCount > 0 
      ? `Are you sure you want to delete this album? This will permanently delete the album and all ${photoCount} photos in it. This action cannot be undone.`
      : 'Are you sure you want to delete this album? This action cannot be undone.';
    
    if (!window.confirm(confirmMessage)) return;
    
    setDeleting(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/albums/${id}`);
      // Redirect to gallery after successful deletion
      navigate('/gallery');
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Failed to delete album. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const setCoverPhoto = async (photoId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/albums/${id}/cover/${photoId}`);
      fetchAlbum(); // Refresh album data
    } catch (error) {
      console.error('Error setting cover photo:', error);
    }
  };

  const openPhotoTagger = (photo) => {
    setSelectedPhoto(photo);
    setShowTagger(true);
  };

  const handleTagUpdate = () => {
    fetchAlbum(); // Refresh album data to show updated tag counts
  };

  // New function to handle photo enlargement
  const enlargePhoto = (photo) => {
    console.log('enlargePhoto called with:', photo);
    setEnlargedPhoto(photo);
    setShowPhotoModal(true);
  };

  // Close photo modal
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setEnlargedPhoto(null);
  };

  // Handle keyboard navigation in modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showPhotoModal || !album || !album.photos || !enlargedPhoto) return;

      if (e.key === 'Escape') {
        closePhotoModal();
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
        if (currentIndex > 0) {
          setEnlargedPhoto(album.photos[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
        if (currentIndex < album.photos.length - 1) {
          setEnlargedPhoto(album.photos[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPhotoModal, enlargedPhoto, album]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading album...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center text-red-500 mt-8">
        <p>Album not found</p>
        <Link to="/gallery" className="text-blue-600 hover:underline">
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <Link to="/gallery" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Gallery
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{album.title}</h1>
            {album.description && (
              <p className="text-gray-600 mt-2">{album.description}</p>
            )}
            {album.event_date && (
              <p className="text-gray-500 text-sm mt-1">
                Event Date: {new Date(album.event_date).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={deleteAlbum}
            disabled={deleting}
            className={`px-4 py-2 rounded text-white ${
              deleting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            title="Delete album"
          >
            {deleting ? 'Deleting...' : 'Delete Album'}
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Upload Photos
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Upload Photos</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
                {selectedFiles.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>
              
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFiles([]);
                    setUploadProgress(0);
                  }}
                  disabled={uploading}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {album.photos && album.photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                alt={photo.caption || 'Photo'}
                className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:opacity-90"
                onClick={() => enlargePhoto(photo)}
              />
              
              {/* Photo overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg pointer-events-none">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverPhoto(photo.id);
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                      title="Set as cover photo"
                    >
                      Cover
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPhotoTagger(photo);
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                      title="Tag people in photo"
                    >
                      Tag
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                      title="Delete photo"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Cover photo indicator */}
              {album.cover_photo_id === photo.id && (
                <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                  Cover Photo
                </div>
              )}
              
              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs max-w-32 truncate">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          <p>No photos in this album yet.</p>
          <p className="text-sm">Click "Upload Photos" to add some!</p>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && enlargedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closePhotoModal}>
          <div className="relative max-w-full max-h-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white text-3xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 z-10"
              title="Close (Esc)"
            >
              ×
            </button>
            
            <img
              src={`${process.env.REACT_APP_API}/${enlargedPhoto.file_path}`}
              alt={enlargedPhoto.caption || 'Photo'}
              className="max-w-screen-lg max-h-screen object-contain"
            />
            
            {/* Navigation arrows */}
            {album && album.photos && album.photos.length > 1 && (
              <>
                <button
                  onClick={() => {
                    if (!album || !album.photos) return;
                    const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
                    if (currentIndex > 0) {
                      setEnlargedPhoto(album.photos[currentIndex - 1]);
                    }
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75"
                  title="Previous photo (←)"
                >
                  ‹
                </button>
                <button
                  onClick={() => {
                    if (!album || !album.photos) return;
                    const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
                    if (currentIndex < album.photos.length - 1) {
                      setEnlargedPhoto(album.photos[currentIndex + 1]);
                    }
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-4xl bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75"
                  title="Next photo (→)"
                >
                  ›
                </button>
              </>
            )}
            
            {/* Photo info */}
            {enlargedPhoto.caption && (
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded text-sm max-w-lg">
                {enlargedPhoto.caption}
              </div>
            )}
            
            {/* Photo counter */}
            {album && album.photos && album.photos.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded text-sm">
                {album.photos.findIndex(p => p.id === enlargedPhoto.id) + 1} / {album.photos.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Tagger Modal */}
      {showTagger && selectedPhoto && (
        <PhotoTagger
          photo={selectedPhoto}
          album={album}
          onClose={() => {
            setShowTagger(false);
            setSelectedPhoto(null);
          }}
          onTagAdded={handleTagUpdate}
        />
      )}
    </div>
  );
};

export default AlbumView;