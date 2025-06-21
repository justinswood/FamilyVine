import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoCropper from './PhotoCropper'; // We'll use your existing cropper

const HeroImageSelector = () => {
  const [allPhotos, setAllPhotos] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // NEW: States for cropping
  const [showCropper, setShowCropper] = useState(false);
  const [selectedPhotoForCrop, setSelectedPhotoForCrop] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  useEffect(() => {
    fetchAllPhotos();
    loadSelectedImages();
  }, []);

  const fetchAllPhotos = async () => {
    try {
      setLoading(true);
      
      // Get all albums
      const albumsResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      const albums = albumsResponse.data;
      
      // Get photos from each album
      const allPhotosArray = [];
      
      for (const album of albums) {
        try {
          const albumResponse = await axios.get(`${process.env.REACT_APP_API}/api/albums/${album.id}`);
          if (albumResponse.data.photos && albumResponse.data.photos.length > 0) {
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

  const loadSelectedImages = async () => {
    try {
      // Load selected images from database instead of localStorage
      const response = await axios.get(`${process.env.REACT_APP_API}/api/hero-images`);
      setSelectedImages(response.data);
    } catch (error) {
      console.error('Error loading hero images from database:', error);
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem('familyVine_heroImages');
      if (saved) {
        try {
          const parsedImages = JSON.parse(saved);
          setSelectedImages(parsedImages);
        } catch (localError) {
          console.error('Error loading saved hero images:', localError);
        }
      }
    }
  };

  const saveSelectedImages = async () => {
    setSaving(true);
    try {
      // Save to localStorage for consistency
      localStorage.setItem('familyVine_heroImages', JSON.stringify(selectedImages));
      
      // Since images are already saved to database individually, just confirm
      alert('Hero images are already saved! The homepage will show these images.');
      
    } catch (error) {
      console.error('Error saving hero images:', error);
      alert('Failed to save hero images');
    } finally {
      setSaving(false);
    }
  };

  // NEW: Function to convert image URL to File object for cropping
  const urlToFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error converting URL to file:', error);
      return null;
    }
  };

  // NEW: Handle crop button click
  const handleCropPhoto = async (photo) => {
    try {
      const imageUrl = `${process.env.REACT_APP_API}/${photo.file_path}`;
      const filename = photo.filename || 'hero-image.jpg';
      
      // Convert the URL to a File object for the cropper
      const file = await urlToFile(imageUrl, filename);
      
      if (file) {
        setSelectedPhotoForCrop(photo);
        setCropImageFile(file);
        setShowCropper(true);
      } else {
        alert('Failed to load image for cropping');
      }
    } catch (error) {
      console.error('Error preparing image for crop:', error);
      alert('Failed to prepare image for cropping');
    }
  };

  // Handle crop completion - save to server
  const handleCropComplete = async (croppedFile) => {
    try {
      setSaving(true);
      
      // Create FormData to send the cropped image to server
      const formData = new FormData();
      formData.append('heroImage', croppedFile);
      formData.append('caption', `Hero image from ${selectedPhotoForCrop.albumTitle}`);
      formData.append('albumTitle', selectedPhotoForCrop.albumTitle || 'gallery');

      // Send to backend
      const response = await axios.post(`${process.env.REACT_APP_API}/api/hero-images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add the saved image to selected images
      const savedImage = response.data;
      setSelectedImages(prev => {
        if (prev.length >= 8) {
          alert('You can select a maximum of 8 images for the hero slideshow');
          return prev;
        }
        return [...prev, {
          ...savedImage,
          albumTitle: selectedPhotoForCrop.albumTitle,
          isCropped: true
        }];
      });

      alert('Hero image saved successfully!');

      // Close cropper
      setShowCropper(false);
      setSelectedPhotoForCrop(null);
      setCropImageFile(null);
      
    } catch (error) {
      console.error('Error saving cropped image:', error);
      alert('Failed to save cropped image');
    } finally {
      setSaving(false);
    }
  };

  // NEW: Handle crop cancellation
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedPhotoForCrop(null);
    setCropImageFile(null);
  };

  const toggleImageSelection = async (photo) => {
    const isSelected = selectedImages.some(img => img.id === photo.id);
    
    if (isSelected) {
      // Remove from selection - delegate to removeImage function
      await removeImage(photo);
    } else {
      // Add to selection (max 8 images)
      if (selectedImages.length >= 8) {
        alert('You can select a maximum of 8 images for the hero slideshow');
        return;
      }
      
      try {
        // Add to database by copying the photo and marking as hero image
        const formData = new FormData();
        
        // Fetch the original image and convert to blob
        const imageResponse = await fetch(`${process.env.REACT_APP_API}/${photo.file_path}`);
        const imageBlob = await imageResponse.blob();
        const imageFile = new File([imageBlob], photo.filename, { type: photo.mime_type });
        
        formData.append('heroImage', imageFile);
        formData.append('caption', photo.caption || `Hero image from ${photo.albumTitle}`);
        formData.append('albumTitle', photo.albumTitle || 'gallery');

        // Send to backend
        const response = await axios.post(`${process.env.REACT_APP_API}/api/hero-images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Update local state
        const savedImage = response.data;
        setSelectedImages(prev => [...prev, {
          ...savedImage,
          albumTitle: photo.albumTitle
        }]);
        
      } catch (error) {
        console.error('Error adding hero image:', error);
        alert('Failed to add hero image');
      }
    }
  };

  const isImageSelected = (photo) => {
    return selectedImages.some(img => img.id === photo.id);
  };

  const moveImageUp = (index) => {
    if (index === 0) return;
    
    setSelectedImages(prev => {
      const newArray = [...prev];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      return newArray;
    });
  };

  const moveImageDown = (index) => {
    if (index === selectedImages.length - 1) return;
    
    setSelectedImages(prev => {
      const newArray = [...prev];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      return newArray;
    });
  };

  const removeImage = async (photo) => {
    try {
      // Remove from database
      await axios.delete(`${process.env.REACT_APP_API}/api/hero-images/${photo.id}`);
      
      // Update local state
      setSelectedImages(prev => prev.filter(img => img.id !== photo.id));
      
      // Update localStorage for consistency
      const updatedImages = selectedImages.filter(img => img.id !== photo.id);
      localStorage.setItem('familyVine_heroImages', JSON.stringify(updatedImages));
      
    } catch (error) {
      console.error('Error removing hero image:', error);
      alert('Failed to remove hero image');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading photos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Homepage Hero Images
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
          Select 6-8 images to display in the rotating hero slideshow on your homepage. 
          Choose images that look good in landscape format and have good visual impact.
          <strong className="text-green-700"> NEW: You can now crop images to fit perfectly!</strong>
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-xs">
          Selected: {selectedImages.length}/8 images
        </p>
      </div>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
            Selected Hero Images (in display order)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedImages.map((photo, index) => (
              <div key={photo.id} className="relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <img
                  src={photo.isCropped ? `${process.env.REACT_APP_API}/${photo.file_path}` : `${process.env.REACT_APP_API}/${photo.file_path}`}
                  alt={photo.caption || 'Hero image'}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity">
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    #{index + 1}
                    {photo.isCropped && <span className="ml-1">✂️</span>}
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={() => moveImageUp(index)}
                      disabled={index === 0}
                      className="bg-white text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveImageDown(index)}
                      disabled={index === selectedImages.length - 1}
                      className="bg-white text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeImage(photo)}
                      className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    From: {photo.albumTitle}
                    {photo.isCropped && <span className="text-green-600 ml-2">(Cropped)</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={saveSelectedImages}
            disabled={saving || selectedImages.length === 0}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Hero Images'}
          </button>
        </div>
      )}

      {/* All Available Photos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
          Available Photos ({allPhotos.length} total)
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Click "Add" to select photos as-is, or "Crop & Add" to crop them first for better hero display.
        </p>
        
        {allPhotos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No photos found in your gallery.</p>
            <p className="text-gray-400 text-sm mt-2">
              Upload photos to albums first to use them as hero images.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  isImageSelected(photo)
                    ? 'border-green-500 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <img
                  src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                  alt={photo.caption || 'Gallery photo'}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
                
                {/* Selection indicator */}
                {isImageSelected(photo) && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => toggleImageSelection(photo)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      {isImageSelected(photo) ? 'Remove' : 'Add'}
                    </button>
                    <button
                      onClick={() => handleCropPhoto(photo)}
                      className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                    >
                      Crop & Add
                    </button>
                  </div>
                </div>
                
                {/* Photo info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-1">
                  <p className="text-xs truncate">{photo.albumTitle}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Cropper Modal */}
      {showCropper && cropImageFile && selectedPhotoForCrop && (
        <PhotoCropper
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default HeroImageSelector;