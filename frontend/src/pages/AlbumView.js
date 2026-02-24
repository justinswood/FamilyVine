import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RotateCw, Trash2 } from 'lucide-react';
import PhotoTagging from '../components/PhotoTagging';
import PhotoCropper from '../components/PhotoCropper';
import PhotoEditorModal from '../components/PhotoEditor/PhotoEditorModal';

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
        <p className="text-vine-sage mb-4">Choose which family member to set this cropped photo as their profile picture:</p>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vine-500 mx-auto mb-2"></div>
            Loading members...
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member.id)}
                disabled={saving}
                className={`w-full text-left p-3 rounded-lg border border-vine-200 transition-colors ${
                  saving
                    ? 'bg-vine-50 cursor-not-allowed'
                    : 'hover:bg-vine-50'
                }`}
              >
                <div className="font-medium">
                  {member.first_name} {member.last_name}
                </div>
                {member.location && (
                  <div className="text-sm text-vine-sage">{member.location}</div>
                )}
              </button>
            ))}
          </div>
        )}
        
        {saving && (
          <div className="mt-4 p-3 bg-vine-50 border border-vine-200 rounded">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vine-500 mr-2"></div>
              <span className="text-vine-600">Saving cropped photo...</span>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              saving
                ? 'bg-vine-200 text-vine-sage cursor-not-allowed'
                : 'bg-vine-500 text-white hover:bg-vine-600'
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lightboxTags, setLightboxTags] = useState([]);
  const [imageFit, setImageFit] = useState(null);
  const modalOverlayRef = useRef(null);
  
  // NEW: Add these state variables for cropping functionality
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [pendingCroppedFile, setPendingCroppedFile] = useState(null);

  // NEW: PhotoEditor state
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedPhotoForEdit, setSelectedPhotoForEdit] = useState(null);

  // Rename album state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [saving, setSaving] = useState(false);

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

  // Open rename modal with current values
  const openRenameModal = () => {
    setEditTitle(album.title || '');
    setEditDescription(album.description || '');
    // Format date for input (YYYY-MM-DD)
    setEditEventDate(album.event_date ? album.event_date.split('T')[0] : '');
    setShowRenameModal(true);
  };

  // Save album changes
  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('Album title is required');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/albums/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        event_date: editEventDate || null,
        is_public: album.is_public
      });

      // Update local state
      setAlbum(prev => ({
        ...prev,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        event_date: editEventDate || null
      }));

      setShowRenameModal(false);
    } catch (error) {
      console.error('Error updating album:', error);
      alert('Failed to update album. Please try again.');
    } finally {
      setSaving(false);
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
        `${process.env.REACT_APP_API ?? ''}/api/albums/${id}/photos/${photo.id}/rotate`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('familyVine_token')}`
          },
          body: JSON.stringify({ degrees: 90 })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to rotate photo');
      }

      // Refresh photos to show rotated image
      await fetchAlbum();

    } catch (error) {
      console.error('Error rotating photo:', error);
      alert('Failed to rotate photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // NEW: PhotoEditor handlers
  const handleEditPhoto = (photo) => {
    setSelectedPhotoForEdit(photo);
    setShowPhotoEditor(true);
  };

  const handlePhotoSaved = (updatedPhoto) => {
    // Refresh album to show updated photo
    fetchAlbum();
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
  const computeImageFit = (naturalW, naturalH) => {
    const containerW = window.innerWidth - 120;
    const containerH = window.innerHeight - 120;
    const scale = Math.min(containerW / naturalW, containerH / naturalH);
    const renderedW = naturalW * scale;
    const renderedH = naturalH * scale;
    setImageFit({
      left: (containerW - renderedW) / 2,
      top: (containerH - renderedH) / 2,
      width: renderedW,
      height: renderedH,
    });
  };

  const fetchLightboxTags = async (photo) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/api/albums/${id}/photos/${photo.id}/tags`
      );
      setLightboxTags(response.data);
    } catch (error) {
      console.error('Error fetching photo tags:', error);
      setLightboxTags([]);
    }
  };

  const enlargePhoto = (photo) => {
    console.log('enlargePhoto called with:', photo);
    setEnlargedPhoto(photo);
    setShowPhotoModal(true);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    fetchLightboxTags(photo);
  };

  // Close photo modal
  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setEnlargedPhoto(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setLightboxTags([]);
    setImageFit(null);
  };

  // Handle scroll wheel zoom in lightbox (native event for passive: false)
  const handleLightboxWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel(prev => {
      const newZoom = Math.min(Math.max(prev + delta, 0.5), 5);
      // Reset pan when zooming back to 1x
      if (newZoom <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Handle mouse down for panning when zoomed
  const handlePanStart = (e) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  // Handle mouse move for panning
  const handlePanMove = (e) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  // Handle mouse up to stop panning
  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Reset zoom when navigating photos
  const navigatePhoto = (direction) => {
    if (!album || !album.photos) return;
    const currentIndex = album.photos.findIndex(p => p.id === enlargedPhoto.id);
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < album.photos.length) {
      const newPhoto = album.photos[newIndex];
      setEnlargedPhoto(newPhoto);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
      setImageFit(null);
      fetchLightboxTags(newPhoto);
    }
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

  // Attach native wheel event listener with { passive: false } to prevent background scrolling
  useEffect(() => {
    const overlay = modalOverlayRef.current;
    if (showPhotoModal && overlay) {
      overlay.addEventListener('wheel', handleLightboxWheel, { passive: false });
      return () => {
        overlay.removeEventListener('wheel', handleLightboxWheel);
      };
    }
  }, [showPhotoModal, handleLightboxWheel]);

  // Handle keyboard navigation in modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showPhotoModal || !album || !album.photos || !enlargedPhoto) return;

      if (e.key === 'Escape') {
        closePhotoModal();
      } else if (e.key === 'ArrowLeft') {
        navigatePhoto(-1);
      } else if (e.key === 'ArrowRight') {
        navigatePhoto(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPhotoModal, enlargedPhoto, album]);

  // Stop panning on mouse up anywhere
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handlePanMove);
      window.addEventListener('mouseup', handlePanEnd);
      return () => {
        window.removeEventListener('mousemove', handlePanMove);
        window.removeEventListener('mouseup', handlePanEnd);
      };
    }
  }, [isPanning, panStart]);

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
        <Link to="/gallery" className="text-vine-600 hover:text-vine-dark hover:underline">
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gallery-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M8,8 L32,8 L32,32 L8,32 Z M12,12 L28,12 L28,28 L12,28 Z M16,16 L24,16 L24,24 L16,24 Z"
                stroke="currentColor" strokeWidth="0.5" className="text-vine-200" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gallery-pattern)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-5 -left-5 w-20 h-20 bg-gradient-to-br from-vine-200/20 to-vine-300/20 rounded-full blur-lg"></div>
        <div className="absolute -top-10 -right-10 w-30 h-30 bg-gradient-to-bl from-vine-100/20 to-vine-200/20 rounded-full blur-lg"></div>
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gradient-to-t from-vine-200/20 to-vine-300/20 rounded-full blur-lg"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto p-3">
        {/* Album Header — Gilded Vellum Ribbon */}
        <div className="gallery-header mb-3">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-1 text-[0.65rem] font-medium transition-colors hover:opacity-80 mb-1"
            style={{ color: 'var(--vine-green, #2E5A2E)' }}
          >
            ← Back to Gallery
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="gallery-header-title">{album.title}</h1>
                <button
                  onClick={openRenameModal}
                  className="p-1 rounded hover:bg-black/5 transition-colors"
                  title="Edit album"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--vine-sage)' }}>
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              </div>
              {album.description && (
                <p className="text-[0.65rem]" style={{ color: 'var(--vine-sage)', fontFamily: 'var(--font-body)', marginTop: '1px' }}>{album.description}</p>
              )}
              {album.event_date && (
                <p className="text-[0.65rem]" style={{ color: 'var(--vine-sage)', fontFamily: 'var(--font-body)', marginTop: '1px' }}>
                  {new Date(album.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[0.6rem] font-medium transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: '#fffdf9',
                  background: 'linear-gradient(135deg, var(--vine-green, #2E5A2E), var(--vine-dark, #2D4F1E))',
                  boxShadow: '0 1px 4px rgba(45, 79, 30, 0.25)',
                }}
              >
                Upload Photos
              </button>
              <button
                onClick={deleteAlbum}
                disabled={deleting}
                className="px-2 py-1 rounded-full text-[0.6rem] font-medium transition-all"
                style={{
                  fontFamily: 'var(--font-body)',
                  color: '#fffdf9',
                  background: deleting ? '#d1d5db' : 'linear-gradient(135deg, #dc2626, #db2777)',
                  boxShadow: deleting ? 'none' : '0 1px 4px rgba(220, 38, 38, 0.25)',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
                title="Delete album"
              >
                {deleting ? 'Deleting...' : 'Delete Album'}
              </button>
            </div>
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
                    className="bg-vine-600 h-2.5 rounded-full transition-all duration-300"
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
                loading="lazy"
                className="w-full h-64 object-cover hover:opacity-90 cursor-pointer transition-all duration-200"
                style={{
                  transform: `rotate(${photo.rotation_degrees || 0}deg)${(photo.rotation_degrees % 180 !== 0 && photo.rotation_degrees) ? ' scale(1.6)' : ''}`,
                  transition: 'transform 0.3s ease'
                }}
                onClick={() => enlargePhoto(photo)}
              />
              
              {/* Photo overlay with Edit and Delete buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg pointer-events-none">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto flex gap-1.5">
                  {/* Edit Photo Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPhoto(photo);
                    }}
                    className="bg-gradient-to-r from-vine-500 to-vine-600 text-white w-6 h-6 rounded-full hover:from-vine-600 hover:to-vine-dark transition-all shadow-md flex items-center justify-center opacity-50 hover:opacity-90"
                    title="Edit photo (crop, rotate, tag)"
                  >
                    <span className="text-[10px]">✏️</span>
                  </button>
                  {/* Delete Photo Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo.id);
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white w-6 h-6 rounded-full hover:from-red-600 hover:to-red-700 transition-all shadow-md flex items-center justify-center opacity-50 hover:opacity-90"
                    title="Delete photo"
                  >
                    <Trash2 size={12} />
                  </button>
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
          ref={modalOverlayRef}
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60]"
          onClick={closePhotoModal}
          style={{
            touchAction: 'none',
            overflow: 'hidden'
          }}
          onTouchStart={(e) => {
            document.body.style.overflow = 'hidden';
          }}
          onTouchEnd={() => {
            document.body.style.overflow = 'auto';
          }}
        >
          <div
            className="relative max-w-full max-h-full overflow-hidden group"
            onClick={(e) => e.stopPropagation()}
            style={{
              touchAction: 'pan-x pan-y pinch-zoom',
              maxWidth: window.innerWidth < 640 ? 'calc(100vw - 16px)' : 'calc(100vw - 64px)',
              maxHeight: window.innerWidth < 640 ? 'calc(100vh - 16px)' : 'calc(100vh - 64px)',
              padding: window.innerWidth < 640 ? '8px' : '32px',
              cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
            }}
          >
            <button
              onClick={closePhotoModal}
              className="absolute top-10 right-4 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/20 hover:border-white/30 transition-all duration-200 z-10 group/close"
              title="Close (Esc)"
              style={{ touchAction: 'manipulation' }}
            >
              <svg className="w-5 h-5 group-hover/close:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image + Tag overlay container */}
            <div
              className="relative"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel}) rotate(${enlargedPhoto.rotation_degrees || 0}deg)`,
                transition: isPanning ? 'none' : 'transform 0.2s ease',
                touchAction: 'pan-x pan-y pinch-zoom',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                width: window.innerWidth < 640 ? 'calc(100vw - 16px)' : 'calc(100vw - 120px)',
                height: window.innerWidth < 640 ? 'calc(100vh - 16px)' : 'calc(100vh - 120px)',
                maxWidth: '100%',
                maxHeight: '100%',
                transformOrigin: 'center center'
              }}
              onMouseDown={handlePanStart}
              onDoubleClick={() => {
                if (zoomLevel > 1) {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                } else {
                  setZoomLevel(2.5);
                }
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
            >
              <img
                src={`${process.env.REACT_APP_API}/${enlargedPhoto.file_path}`}
                alt={enlargedPhoto.caption || 'Photo'}
                className="object-contain rounded-lg"
                style={{
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
                draggable={false}
                onLoad={(e) => computeImageFit(e.target.naturalWidth, e.target.naturalHeight)}
              />

              {/* Tag dot overlays — positioned over the actual rendered image area */}
              {imageFit && lightboxTags.length > 0 && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: imageFit.left,
                    top: imageFit.top,
                    width: imageFit.width,
                    height: imageFit.height,
                  }}
                >
                  {lightboxTags.filter(t => t.x_coordinate != null && t.y_coordinate != null).map((tag) => (
                    <div
                      key={tag.id}
                      className="absolute group/tag"
                      style={{
                        left: `${tag.x_coordinate}%`,
                        top: `${tag.y_coordinate}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'auto',
                      }}
                    >
                      <div className="w-5 h-5 rounded-full opacity-0 group-hover/tag:opacity-100 group-hover/tag:bg-white/30 group-hover/tag:border-2 group-hover/tag:border-white/60 transition-all duration-200 cursor-pointer" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-black/85 text-white text-xs px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/tag:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg">
                        {tag.member_name}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-black/85" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zoom indicator */}
            {zoomLevel !== 1 && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1.5 rounded text-sm z-10">
                {Math.round(zoomLevel * 100)}%
              </div>
            )}

            {/* Navigation arrows */}
            {album && album.photos && album.photos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto(-1)}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/20 hover:border-white/30 hover:scale-105 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 group/prev"
                  title="Previous photo (←)"
                  style={{ touchAction: 'manipulation' }}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <svg className="w-6 h-6 group-hover/prev:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigatePhoto(1)}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-white/20 hover:border-white/30 hover:scale-105 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 group/next"
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

            {/* Bottom toolbar - Rotate & Set as Cover */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRotatePhoto(enlargedPhoto);
                }}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs hover:bg-white/20 hover:border-white/30 transition-all"
                title="Rotate 90° clockwise"
              >
                <RotateCw size={14} />
                Rotate
              </button>
              {album.cover_photo_id !== enlargedPhoto.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCoverPhoto(enlargedPhoto.id);
                  }}
                  className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full text-xs hover:bg-white/20 hover:border-white/30 transition-all"
                  title="Set as album cover"
                >
                  <span>⭐</span>
                  Set as Cover
                </button>
              )}
              {album.cover_photo_id === enlargedPhoto.id && (
                <div className="flex items-center gap-1.5 bg-green-500/80 backdrop-blur-sm border border-green-400/50 text-white px-3 py-1.5 rounded-full text-xs">
                  <span>✓</span>
                  Cover Photo
                </div>
              )}
              {/* Delete Photo Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
                    deletePhoto(enlargedPhoto.id);
                    closePhotoModal();
                  }
                }}
                className="flex items-center gap-1.5 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-3 py-1.5 rounded-full text-xs hover:bg-red-500/40 hover:border-red-400/50 hover:text-white transition-all"
                title="Delete photo"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Rename Album Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-6 rounded-xl max-w-md w-full shadow-2xl border border-white/50 dark:border-gray-700">
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
                Edit Album
              </h2>
              <form onSubmit={handleSaveAlbum} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Album Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
                    placeholder="Album title"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-4 py-2.5 h-24 bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all resize-none"
                    placeholder="Album description (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--vine-sage)' }}>
                    When were these photos taken?
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                      boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRenameModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-vine-200 dark:border-gray-600 text-vine-dark dark:text-gray-300 hover:bg-vine-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
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

        {/* NEW: Unified Photo Editor Modal */}
        {showPhotoEditor && selectedPhotoForEdit && (
        <PhotoEditorModal
          photo={selectedPhotoForEdit}
          albumId={id}
          onSave={handlePhotoSaved}
          onClose={() => {
            setShowPhotoEditor(false);
            if (enlargedPhoto) fetchLightboxTags(enlargedPhoto);
          }}
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