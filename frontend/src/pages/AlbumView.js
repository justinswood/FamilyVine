import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RotateCw } from 'lucide-react';
import PhotoTagging from '../components/PhotoTagging';
import PhotoCropper from '../components/PhotoCropper'; // Add this import

// Add this new component for member selection
// Replace your MemberSelectionModal component with this simplified version

const MemberSelectionModal = ({ isOpen, onClose, onSelectMember, croppedFile }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);
  
  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load family members. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectMember = async (memberId) => {
    setSaving(true);
    try {
      console.log('Starting to save cropped image for member:', memberId);
      
      // First, get the current member data
      const memberResponse = await axios.get(`${process.env.REACT_APP_API}/api/members/${memberId}`);
      const memberData = memberResponse.data;
      
      console.log('Current member data:', memberData);
      
      // Create FormData with ONLY the essential fields
      const formData = new FormData();
      
      // Add the photo file
      formData.append('photo', croppedFile);
      
      // Add ONLY the required fields and existing data
      formData.append('first_name', memberData.first_name);
      formData.append('last_name', memberData.last_name);
      
      // Add other fields only if they actually exist (not null/undefined)
      if (memberData.middle_name) formData.append('middle_name', memberData.middle_name);
      if (memberData.gender) formData.append('gender', memberData.gender);
      if (memberData.relationship) formData.append('relationship', memberData.relationship);
      if (memberData.birth_date) formData.append('birth_date', memberData.birth_date);
      if (memberData.death_date) formData.append('death_date', memberData.death_date);
      if (memberData.birth_place) formData.append('birth_place', memberData.birth_place);
      if (memberData.death_place) formData.append('death_place', memberData.death_place);
      if (memberData.location) formData.append('location', memberData.location);
      if (memberData.occupation) formData.append('occupation', memberData.occupation);
      if (memberData.pronouns) formData.append('pronouns', memberData.pronouns);
      if (memberData.email) formData.append('email', memberData.email);
      if (memberData.phone) formData.append('phone', memberData.phone);
      
      // Handle is_alive specially
      formData.append('is_alive', memberData.is_alive === true || memberData.is_alive === 'true' ? 'true' : 'false');
      
      // Debug: Log what we're sending
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      console.log('Sending PUT request...');
      
      const updateResponse = await axios.put(
        `${process.env.REACT_APP_API}/api/members/${memberId}`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        }
      );
      
      console.log('Update successful:', updateResponse.data);
      alert('Profile photo updated successfully!');
      onSelectMember(memberId);
      onClose();
      
    } catch (error) {
      console.error('Error saving cropped image:', error);
      
      if (error.response && error.response.data) {
        console.error('Server error response:', error.response.data);
        alert(`Server error: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert('Failed to save cropped image. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Select Family Member</h2>
        <p className="text-gray-600 mb-4">Choose which family member to set this cropped photo as their profile picture:</p>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading members...
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member.id)}
                disabled={saving}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  saving 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">
                  {member.first_name} {member.last_name}
                </div>
                {member.location && (
                  <div className="text-sm text-gray-500">{member.location}</div>
                )}
              </button>
            ))}
          </div>
        )}
        
        {saving && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-blue-700">Saving cropped photo...</span>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              saving 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const AlbumView = () => {
  // Your existing state variables
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  
  // NEW: Add these state variables for cropping functionality
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [pendingCroppedFile, setPendingCroppedFile] = useState(null);

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

  // NEW: Function to convert image URL to File object
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

  // NEW: Function to handle cropping gallery images
  const handleCropGalleryImage = async (photo) => {
    try {
      const imageUrl = `${process.env.REACT_APP_API}/${photo.file_path}`;
      const filename = photo.filename || 'gallery-image.jpg';
      
      // Convert the URL to a File object
      const file = await urlToFile(imageUrl, filename);
      
      if (file) {
        setSelectedImageForCrop(photo);
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

  // NEW: Function to handle crop completion
  const handleCropComplete = async (croppedFile) => {
    setShowCropper(false);
    setPendingCroppedFile(croppedFile);
    setShowMemberSelection(true);
  };

  // NEW: Function to handle crop cancellation
  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImageForCrop(null);
    setCropImageFile(null);
  };

  // Function to rotate a photo 90° clockwise
  const handleRotatePhoto = async (photo) => {
    if (!window.confirm('Rotate this photo 90° clockwise?')) {
      return;
    }

    setUploading(true); // Reuse existing loading state

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API || 'http://localhost:5050'}/api/albums/${id}/photos/${photo.id}/rotate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ degrees: 90 })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to rotate photo');
      }

      // Refresh photos to show rotated image
      await fetchPhotos();

    } catch (error) {
      console.error('Error rotating photo:', error);
      alert('Failed to rotate photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // NEW: Handler for when member is selected
  const handleMemberSelected = (memberId) => {
    setShowMemberSelection(false);
    setPendingCroppedFile(null);
    setSelectedImageForCrop(null);
    setCropImageFile(null);
  };

  // NEW: Handler for closing member selection without selecting
  const handleMemberSelectionClose = () => {
    setShowMemberSelection(false);
    setPendingCroppedFile(null);
    setSelectedImageForCrop(null);
    setCropImageFile(null);
  };

  // Your existing functions (unchanged)
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

  // Updated handlers for the new PhotoTagging component
  const handleTagSaved = (newTag) => {
    console.log('New tag saved:', newTag);
    // Optionally refresh album data to update any tag counts
    fetchAlbum();
  };

  const handleTagDeleted = (tagId) => {
    console.log('Tag deleted:', tagId);
    // Optionally refresh album data to update any tag counts
    fetchAlbum();
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

  // Handle body overflow when modal is open (prevent background scrolling)
  useEffect(() => {
    if (showPhotoModal) {
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [showPhotoModal]);

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
      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-4 mb-6 border border-white/50">
          <Link to="/gallery" className="text-blue-600 hover:text-purple-600 mb-2 inline-block text-sm transition-colors">
            ← Back to Gallery
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{album.title}</h1>
              {album.description && (
                <p className="text-gray-600 mt-1 text-sm">{album.description}</p>
              )}
              {album.event_date && (
                <p className="text-gray-500 text-xs mt-1">
                  Event Date: {new Date(album.event_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={deleteAlbum}
              disabled={deleting}
              className={`px-3 py-1.5 rounded-full text-white text-sm ${
                deleting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all shadow-md'
              }`}
              title="Delete album"
            >
              {deleting ? 'Deleting...' : 'Delete Album'}
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-md text-sm font-medium"
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
                  accept="image/*,.heic,.heif"
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

        {/* Photos Grid - UPDATED with Crop Button */}
        {album.photos && album.photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo) => (
            <div key={photo.id} className="relative group bg-white/50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              <img
                src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                alt={photo.caption || 'Photo'}
                className="w-full h-64 object-cover hover:opacity-90 cursor-pointer transition-all duration-200 hover:scale-105"
                onClick={() => enlargePhoto(photo)}
              />
              
              {/* Photo overlay with actions - UPDATED */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg pointer-events-none">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoverPhoto(photo.id);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm"
                      title="Set as cover photo"
                    >
                      Cover
                    </button>
                    {/* NEW: Crop Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCropGalleryImage(photo);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
                      title="Crop image"
                    >
                      Crop
                    </button>
                    {/* NEW: Rotate Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotatePhoto(photo);
                      }}
                      disabled={uploading || deleting}
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-2 py-1 rounded-full text-xs hover:from-teal-600 hover:to-cyan-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      title="Rotate photo 90° clockwise"
                    >
                      <RotateCw className="w-3 h-3" />
                      Rotate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPhotoTagger(photo);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs hover:from-green-600 hover:to-emerald-600 transition-all shadow-sm"
                      title="Tag people in photo"
                    >
                      Tag
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo.id);
                      }}
                      className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs hover:from-red-600 hover:to-pink-600 transition-all shadow-sm"
                      title="Delete photo"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Cover photo indicator */}
              {album.cover_photo_id === photo.id && (
                <div className="absolute bottom-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs shadow-md">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-12 text-center shadow-lg border border-white/50">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No photos in this album yet.</p>
              <p className="text-sm">Click "Upload Photos" to add some!</p>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {showPhotoModal && enlargedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" 
          onClick={closePhotoModal}
          style={{
            touchAction: 'none',
            overflow: 'hidden'
          }}
          onTouchStart={(e) => {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
          }}
          onTouchEnd={() => {
            // Re-enable background scrolling when modal closes
            document.body.style.overflow = 'auto';
          }}
        >
          <div 
            className="relative max-w-full max-h-full overflow-hidden group" 
            onClick={(e) => e.stopPropagation()}
            style={{
              touchAction: 'pan-x pan-y pinch-zoom',
              maxWidth: '100vw',
              maxHeight: '100vh'
            }}
          >
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-200 z-10 group/close"
              title="Close (Esc)"
              style={{ touchAction: 'manipulation' }}
            >
              <svg className="w-5 h-5 group-hover/close:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <img
              src={`${process.env.REACT_APP_API}/${enlargedPhoto.file_path}`}
              alt={enlargedPhoto.caption || 'Photo'}
              className="max-w-screen-lg max-h-screen object-contain"
              style={{
                touchAction: 'pan-x pan-y pinch-zoom',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: 'auto',
                height: 'auto'
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
              draggable={false}
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-12 h-12 flex items-center justify-center hover:bg-white/20 hover:border-white/30 hover:scale-105 opacity-0 group-hover:opacity-100 transition-all duration-300 group/prev"
                  title="Previous photo (←)"
                  style={{ touchAction: 'manipulation' }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <svg className="w-6 h-6 group-hover/prev:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (!album || !album.photos) return;
                    const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
                    if (currentIndex < album.photos.length - 1) {
                      setEnlargedPhoto(album.photos[currentIndex + 1]);
                    }
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-12 h-12 flex items-center justify-center hover:bg-white/20 hover:border-white/30 hover:scale-105 opacity-0 group-hover:opacity-100 transition-all duration-300 group/next"
                  title="Next photo (→)"
                  style={{ touchAction: 'manipulation' }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <svg className="w-6 h-6 group-hover/next:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
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

        {/* Photo Tagging Modal */}
        {showTagger && selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-full overflow-auto">
            <PhotoTagging
              photo={selectedPhoto}
              albumId={album.id}
              onSaveTag={handleTagSaved}
              onDeleteTag={handleTagDeleted}
              onClose={() => {
                setShowTagger(false);
                setSelectedPhoto(null);
              }}
            />
          </div>
        </div>
      )}

        {/* NEW: Photo Cropper Modal for Gallery Images */}
        {showCropper && cropImageFile && selectedImageForCrop && (
        <PhotoCropper
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

        {/* NEW: Member Selection Modal */}
        {showMemberSelection && pendingCroppedFile && (
        <MemberSelectionModal
          isOpen={showMemberSelection}
          onClose={handleMemberSelectionClose}
          onSelectMember={handleMemberSelected}
          croppedFile={pendingCroppedFile}
        />
      )}
      </div>
    </div>
  );
};

export default AlbumView;