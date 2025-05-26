import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhotoGalleryPicker = ({ onPhotoSelect, onCancel }) => {
  const [albums, setAlbums] = useState([]);
  const [allPhotos, setAllPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchAllPhotos();
  }, []);

  const fetchAllPhotos = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get all albums
      const albumsResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      const albumsList = albumsResponse.data;
      setAlbums(albumsList);
      
      // Step 2: Get photos from each album
      const allPhotosArray = [];
      
      for (const album of albumsList) {
        try {
          const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums/${album.id}`);
          if (albumResponse.data.photos && albumResponse.data.photos.length > 0) {
            // Add album info to each photo
            const photosWithAlbum = albumResponse.data.photos.map(photo => ({
              ...photo,
              albumTitle: album.title,
              albumId: album.id
            }));
            allPhotosArray.push(...photosWithAlbum);
          }
        } catch (error) {
          console.error(`Error fetching photos from album ${album.id}:`, error);
        }
      }
      
      setAllPhotos(allPhotosArray);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleConfirmSelection = () => {
    if (selectedPhoto) {
      // Pass the photo path back to the parent component
      onPhotoSelect(selectedPhoto.file_path);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading photos from gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Choose Photo from Gallery</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Select a photo from your family albums to use as profile picture
          </p>
        </div>

        {/* Photos Grid */}
        <div className="p-4 overflow-y-auto max-h-96">
          {allPhotos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No photos found in your gallery.</p>
              <p className="text-gray-400 text-sm mt-2">
                Upload photos to albums first to use them as profile pictures.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {allPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedPhoto?.id === photo.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img
                    src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                    alt={photo.caption || 'Gallery photo'}
                    className="w-full h-24 object-cover"
                  />
                  
                  {/* Selection indicator */}
                  {selectedPhoto?.id === photo.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      ✓
                    </div>
                  )}
                  
                  {/* Photo info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                    <p className="text-xs truncate">{photo.albumTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with buttons */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedPhoto ? (
                <span>Selected: Photo from "{selectedPhoto.albumTitle}"</span>
              ) : (
                <span>Click on a photo to select it</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedPhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Use This Photo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryPicker;