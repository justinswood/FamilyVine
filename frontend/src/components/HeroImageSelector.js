import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PhotoCropper from './PhotoCropper';

const HeroImageSelector = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cropping states
  const [showCropper, setShowCropper] = useState(false);
  const [selectedPhotoForCrop, setSelectedPhotoForCrop] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  useEffect(() => {
    fetchAlbums();
    loadSelectedImages();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      setAlbums(response.data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumPhotos = async (albumId) => {
    try {
      setLoadingPhotos(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/albums/${albumId}`);
      const album = albums.find(a => a.id === albumId);

      if (response.data.photos) {
        const photosWithAlbum = response.data.photos.map(photo => ({
          ...photo,
          albumTitle: album?.title || 'Unknown Album',
          albumId: album?.id
        }));
        setAlbumPhotos(photosWithAlbum);
      }
    } catch (error) {
      console.error('Error fetching album photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const loadSelectedImages = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/hero-images`);
      setSelectedImages(response.data);
    } catch (error) {
      console.error('Error loading hero images:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('familyVine_heroImages');
      if (saved) {
        try {
          setSelectedImages(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing saved hero images:', e);
        }
      }
    }
  };

  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
    fetchAlbumPhotos(album.id);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
    setAlbumPhotos([]);
  };

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

  const handleCropPhoto = async (photo) => {
    try {
      const imageUrl = `${process.env.REACT_APP_API}/${photo.file_path}`;
      const filename = photo.filename || 'hero-image.jpg';

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

  const handleCropComplete = async (croppedFile) => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('heroImage', croppedFile);
      formData.append('caption', `Hero image from ${selectedPhotoForCrop.albumTitle}`);
      formData.append('albumTitle', selectedPhotoForCrop.albumTitle || 'gallery');

      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/hero-images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

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

      // Update localStorage
      localStorage.setItem('familyVine_heroImages', JSON.stringify([
        ...selectedImages,
        { ...savedImage, albumTitle: selectedPhotoForCrop.albumTitle, isCropped: true }
      ]));

      alert('Hero image saved successfully!');
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

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedPhotoForCrop(null);
    setCropImageFile(null);
  };

  const addPhotoDirectly = async (photo) => {
    if (selectedImages.length >= 8) {
      alert('You can select a maximum of 8 images for the hero slideshow');
      return;
    }

    try {
      setSaving(true);

      // Fetch and convert the image
      const imageResponse = await fetch(`${process.env.REACT_APP_API}/${photo.file_path}`);
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], photo.filename, { type: photo.mime_type });

      const formData = new FormData();
      formData.append('heroImage', imageFile);
      formData.append('caption', photo.caption || `Hero image from ${photo.albumTitle}`);
      formData.append('albumTitle', photo.albumTitle || 'gallery');

      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/hero-images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const savedImage = response.data;
      const newImage = { ...savedImage, albumTitle: photo.albumTitle };
      setSelectedImages(prev => [...prev, newImage]);

      // Update localStorage
      localStorage.setItem('familyVine_heroImages', JSON.stringify([...selectedImages, newImage]));

    } catch (error) {
      console.error('Error adding hero image:', error);
      alert('Failed to add hero image');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (photo) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/hero-images/${photo.id}`);

      const updatedImages = selectedImages.filter(img => img.id !== photo.id);
      setSelectedImages(updatedImages);
      localStorage.setItem('familyVine_heroImages', JSON.stringify(updatedImages));

    } catch (error) {
      console.error('Error removing hero image:', error);
      alert('Failed to remove hero image');
    }
  };

  const moveImageUp = (index) => {
    if (index === 0) return;

    setSelectedImages(prev => {
      const newArray = [...prev];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      localStorage.setItem('familyVine_heroImages', JSON.stringify(newArray));
      return newArray;
    });
  };

  const moveImageDown = (index) => {
    if (index === selectedImages.length - 1) return;

    setSelectedImages(prev => {
      const newArray = [...prev];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      localStorage.setItem('familyVine_heroImages', JSON.stringify(newArray));
      return newArray;
    });
  };

  const isPhotoSelected = (photo) => {
    return selectedImages.some(img => {
      // Check if it's the same photo from the same album
      return img.albumTitle === photo.albumTitle &&
             (img.caption === photo.caption || img.filename === photo.filename);
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading albums...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Homepage Hero Images
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
          Select 6-8 images to display in the rotating hero slideshow on your homepage.
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-sm mb-2">
          <strong>Important:</strong> Images are displayed in <strong>3:2 landscape format</strong> (wider than tall).
          Use "Crop & Add" to crop photos to this format for best results.
        </p>
        <p className="text-blue-600 dark:text-blue-400 text-xs">
          Selected: {selectedImages.length}/8 images
        </p>
      </div>

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
            Selected Hero Images (Display Order)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedImages.map((photo, index) => (
              <div key={photo.id} className="relative border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                {/* 3:2 aspect ratio preview - matches homepage */}
                <div className="relative w-full" style={{ paddingBottom: '66.67%' }}>
                  <img
                    src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                    alt={photo.caption || 'Hero image'}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                  {photo.isCropped && <span className="ml-1">✂️</span>}
                </div>
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => moveImageUp(index)}
                    disabled={index === 0}
                    className="bg-white text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveImageDown(index)}
                    disabled={index === selectedImages.length - 1}
                    className="bg-white text-gray-700 p-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
                <div className="p-2 bg-gray-50 dark:bg-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    From: {photo.albumTitle}
                    {photo.isCropped && <span className="text-green-600 ml-2">(Cropped to 3:2)</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Album Selection or Photo Selection */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        {!selectedAlbum ? (
          <>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-4">
              Select an Album
            </h4>
            {albums.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No albums found.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Create albums and upload photos first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => handleAlbumClick(album)}
                    className="text-left bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                        📁
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {album.title}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Click to browse
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBackToAlbums}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Back to Albums
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {selectedAlbum.title}
              </span>
            </div>

            {/* Photos in Album */}
            {loadingPhotos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p>Loading photos...</p>
              </div>
            ) : albumPhotos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No photos in this album.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Click "Add" to use the photo as-is, or "Crop to 3:2" to crop it for better display.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {albumPhotos.map((photo) => {
                    const alreadySelected = isPhotoSelected(photo);
                    return (
                      <div
                        key={photo.id}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          alreadySelected
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

                        {alreadySelected && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="flex flex-col space-y-1">
                            {!alreadySelected && (
                              <>
                                <button
                                  onClick={() => addPhotoDirectly(photo)}
                                  disabled={saving}
                                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => handleCropPhoto(photo)}
                                  disabled={saving}
                                  className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                                >
                                  Crop to 3:2
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Photo Cropper Modal - with 3:2 aspect ratio */}
      {showCropper && cropImageFile && selectedPhotoForCrop && (
        <PhotoCropper
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={3/2}
          title="Crop Hero Image (3:2 Landscape)"
          description="Crop the image to a 3:2 landscape format to match the homepage display."
        />
      )}
    </div>
  );
};

export default HeroImageSelector;
