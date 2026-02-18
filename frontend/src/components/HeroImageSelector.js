import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { MapPin, Users, Eye, ChevronUp, ChevronDown, X, Search, ArrowRight } from 'lucide-react';
import PhotoCropper from './PhotoCropper';
import HeroPreviewModal from './HeroPreviewModal';

const BLURB_MAX = 250;
const BLURB_IDEAL_MIN = 150;
const BLURB_IDEAL_MAX = 200;

/* ── Photo Stack Preview — 3 overlapping thumbnails ── */
const PhotoStackPreview = ({ album }) => {
  const photos = album.recent_photos || [];
  if (photos.length === 0) {
    return (
      <div className="hero-album-stack">
        <div className="hero-album-stack-empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div className="hero-album-stack">
      {photos.slice(0, 3).map((photo, i) => (
        <img
          key={photo.id || i}
          src={`${process.env.REACT_APP_API}/${photo.file_path}`}
          alt=""
          className="hero-album-stack-img"
          style={{
            zIndex: 3 - i,
            transform: `rotate(${(i - 1) * 4}deg) translate(${i * 2}px, ${i * 1}px)`,
          }}
          loading="lazy"
        />
      ))}
    </div>
  );
};

const HeroImageSelector = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');

  // Cropping states
  const [showCropper, setShowCropper] = useState(false);
  const [selectedPhotoForCrop, setSelectedPhotoForCrop] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  // Tag member dropdown
  const [tagDropdownPhotoId, setTagDropdownPhotoId] = useState(null);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const tagDropdownRef = useRef(null);

  // Auto-save status per photo
  const [saveStatuses, setSaveStatuses] = useState({});
  const saveTimers = useRef({});

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);

  useEffect(() => {
    fetchAlbums();
    loadSelectedImages();
    fetchMembers();
  }, []);

  // Close tag dropdown on click outside
  useEffect(() => {
    if (!tagDropdownPhotoId) return;
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagDropdownPhotoId(null);
        setTagSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tagDropdownPhotoId]);

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

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setMembers((response.data || []).filter(m =>
        !m.first_name?.toLowerCase().includes('unknown') &&
        !m.last_name?.toLowerCase().includes('unknown')
      ));
    } catch (error) {
      console.error('Error fetching members:', error);
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
        const updated = [...prev, {
          ...savedImage,
          albumTitle: selectedPhotoForCrop.albumTitle,
          isCropped: true,
          tagged_members: []
        }];
        localStorage.setItem('familyVine_heroImages', JSON.stringify(updated));
        return updated;
      });

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
      const newImage = { ...savedImage, albumTitle: photo.albumTitle, tagged_members: [] };
      setSelectedImages(prev => {
        const updated = [...prev, newImage];
        localStorage.setItem('familyVine_heroImages', JSON.stringify(updated));
        return updated;
      });
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

  // Auto-save curator fields with debounce
  const saveCuratorField = useCallback((photoId, updates) => {
    if (saveTimers.current[photoId]) {
      clearTimeout(saveTimers.current[photoId]);
    }

    setSaveStatuses(prev => ({ ...prev, [photoId]: 'saving' }));

    saveTimers.current[photoId] = setTimeout(async () => {
      try {
        const response = await axios.put(
          `${process.env.REACT_APP_API}/api/hero-images/${photoId}`,
          updates
        );
        setSelectedImages(prev =>
          prev.map(img => img.id === photoId ? { ...img, ...response.data } : img)
        );
        setSaveStatuses(prev => ({ ...prev, [photoId]: 'saved' }));
        setTimeout(() => {
          setSaveStatuses(prev => ({ ...prev, [photoId]: null }));
        }, 2000);
      } catch (error) {
        console.error('Error saving curator field:', error);
        setSaveStatuses(prev => ({ ...prev, [photoId]: 'error' }));
        setTimeout(() => {
          setSaveStatuses(prev => ({ ...prev, [photoId]: null }));
        }, 3000);
      }
    }, 800);
  }, []);

  const handleBlurbChange = (photoId, value) => {
    if (value.length > BLURB_MAX) return;
    setSelectedImages(prev =>
      prev.map(img => img.id === photoId ? { ...img, hero_blurb: value } : img)
    );
    saveCuratorField(photoId, { hero_blurb: value });
  };

  const handleLocationChange = (photoId, value) => {
    setSelectedImages(prev =>
      prev.map(img => img.id === photoId ? { ...img, hero_location_override: value } : img)
    );
    saveCuratorField(photoId, { hero_location_override: value });
  };

  const handleCaptionChange = (photoId, value) => {
    setSelectedImages(prev =>
      prev.map(img => img.id === photoId ? { ...img, caption: value } : img)
    );
    saveCuratorField(photoId, { caption: value });
  };

  const toggleTagMember = (photoId, memberId) => {
    const photo = selectedImages.find(img => img.id === photoId);
    const currentIds = photo?.hero_tagged_ids || [];
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter(id => id !== memberId)
      : [...currentIds, memberId];

    setSelectedImages(prev =>
      prev.map(img => {
        if (img.id !== photoId) return img;
        const taggedMembers = members.filter(m => newIds.includes(m.id));
        return { ...img, hero_tagged_ids: newIds, tagged_members: taggedMembers };
      })
    );
    saveCuratorField(photoId, { hero_tagged_ids: newIds });
  };

  const removeTaggedMember = (photoId, memberId) => {
    toggleTagMember(photoId, memberId);
  };

  const isPhotoSelected = (photo) => {
    return selectedImages.some(img =>
      img.albumTitle === photo.albumTitle &&
      (img.caption === photo.caption || img.filename === photo.filename)
    );
  };

  const getCharCounterClass = (length) => {
    if (length >= BLURB_IDEAL_MIN && length <= BLURB_IDEAL_MAX) return 'ideal-length';
    if (length > BLURB_MAX - 10) return 'over-limit';
    return '';
  };

  const filteredMembers = members.filter(m => {
    if (!tagSearchQuery) return true;
    const q = tagSearchQuery.toLowerCase();
    return (m.first_name?.toLowerCase().includes(q) || m.last_name?.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-vine-500 border-t-transparent mx-auto mb-4"></div>
        <p>Loading albums...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="hero-selector-banner">
        <h3>Family Curator</h3>
        <p>
          Curate the homepage experience. Select images and write the stories behind each moment.
        </p>
        <p>
          <strong>Tip:</strong> Narratives between <strong>150-200 characters</strong> display best
          in the Storybook layout. Use "Crop & Add" for landscape formatting.
        </p>
        <p className="hero-selector-count">
          Curated: {selectedImages.length}/8 images
        </p>
      </div>

      {/* Curated Image Slots */}
      {selectedImages.length > 0 && (
        <div className="settings-content-panel">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium dark:text-gray-200" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
              Curated Hero Images
            </h4>
            <button
              onClick={() => { setPreviewSlide(0); setShowPreview(true); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--vine-green)',
                background: 'rgba(46, 90, 46, 0.08)',
                border: '1px solid rgba(46, 90, 46, 0.15)',
              }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Homepage
            </button>
          </div>

          <div className="space-y-4">
            {selectedImages.map((photo, index) => (
              <div key={photo.id} className="curator-slot">
                {/* Visual Column */}
                <div className="curator-visual">
                  <img
                    src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                    alt={photo.caption || 'Hero image'}
                    loading="lazy"
                  />
                  <div className="curator-slot-badge">
                    Slot #{index + 1}
                    {photo.isCropped && ' \u2702'}
                  </div>
                  <div className="curator-live-badge">Live</div>
                  <div className="curator-slot-actions">
                    <button
                      onClick={() => moveImageUp(index)}
                      disabled={index === 0}
                      className="curator-action-btn"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveImageDown(index)}
                      disabled={index === selectedImages.length - 1}
                      className="curator-action-btn"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeImage(photo)}
                      className="curator-action-btn curator-action-btn-danger"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Narrative Column */}
                <div className="curator-narrative">
                  {/* Caption / Title */}
                  <div className="curator-narrative-label">Title</div>
                  <input
                    type="text"
                    value={photo.caption || ''}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                    placeholder="Give this moment a title..."
                    className="curator-location-input"
                    style={{ marginTop: 0, marginBottom: 10 }}
                  />

                  {/* Narrative blurb */}
                  <div className="curator-narrative-label">Historical Narrative</div>
                  <textarea
                    value={photo.hero_blurb || ''}
                    onChange={(e) => handleBlurbChange(photo.id, e.target.value)}
                    placeholder="What happened in this moment? Who is gathered here?"
                    className="vellum-textarea"
                    maxLength={BLURB_MAX}
                  />

                  <div className="flex items-center justify-between">
                    <span className={`curator-char-counter ${getCharCounterClass((photo.hero_blurb || '').length)}`}>
                      {(photo.hero_blurb || '').length} / {BLURB_MAX} characters
                      {(photo.hero_blurb || '').length >= BLURB_IDEAL_MIN &&
                       (photo.hero_blurb || '').length <= BLURB_IDEAL_MAX &&
                        ' \u2014 ideal length'}
                    </span>
                    {saveStatuses[photo.id] && (
                      <span className={`curator-save-status ${saveStatuses[photo.id]}`}>
                        {saveStatuses[photo.id] === 'saving' ? 'Saving...' : saveStatuses[photo.id] === 'error' ? 'Save failed' : 'Saved'}
                      </span>
                    )}
                  </div>

                  {/* Location override */}
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--vine-sage)' }} />
                    <input
                      type="text"
                      value={photo.hero_location_override || ''}
                      onChange={(e) => handleLocationChange(photo.id, e.target.value)}
                      placeholder="Location (e.g., Picayune, MS)"
                      className="curator-location-input flex-1"
                      style={{ marginTop: 0 }}
                    />
                  </div>

                  {/* Tagged members */}
                  <div className="relative" ref={tagDropdownPhotoId === photo.id ? tagDropdownRef : null}>
                    {photo.tagged_members && photo.tagged_members.length > 0 && (
                      <div className="curator-tagged-avatars">
                        {photo.tagged_members.map(member => (
                          <div
                            key={member.id}
                            className="curator-tagged-avatar"
                            title={`${member.first_name} ${member.last_name} (click to remove)`}
                            onClick={() => removeTaggedMember(photo.id, member.id)}
                          >
                            {member.photo_url ? (
                              <img
                                src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{member.first_name?.charAt(0)}{member.last_name?.charAt(0)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setTagDropdownPhotoId(tagDropdownPhotoId === photo.id ? null : photo.id);
                        setTagSearchQuery('');
                      }}
                      className="curator-tag-btn"
                    >
                      <Users className="w-3 h-3" />
                      Tag Members
                    </button>

                    {tagDropdownPhotoId === photo.id && (
                      <div className="curator-member-dropdown">
                        <div className="p-2 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
                          <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(134, 167, 137, 0.06)' }}>
                            <Search className="w-3 h-3" style={{ color: 'var(--vine-sage)' }} />
                            <input
                              type="text"
                              value={tagSearchQuery}
                              onChange={(e) => setTagSearchQuery(e.target.value)}
                              placeholder="Search members..."
                              className="flex-1 bg-transparent border-none outline-none text-xs"
                              style={{ fontFamily: 'var(--font-body)', color: 'inherit' }}
                              autoFocus
                            />
                            <button
                              onClick={() => { setTagDropdownPhotoId(null); setTagSearchQuery(''); }}
                              className="p-0.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Close"
                            >
                              <X className="w-3 h-3" style={{ color: '#999' }} />
                            </button>
                          </div>
                        </div>
                        <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                          {filteredMembers.slice(0, 20).map(member => {
                            const isTagged = (photo.hero_tagged_ids || []).includes(member.id);
                            return (
                              <div
                                key={member.id}
                                className="curator-member-option"
                                onClick={() => toggleTagMember(photo.id, member.id)}
                                style={{ opacity: isTagged ? 0.5 : 1 }}
                              >
                                {member.photo_url ? (
                                  <img src={`${process.env.REACT_APP_API}/${member.photo_url}`} alt="" />
                                ) : (
                                  <div className="member-initials">
                                    {member.first_name?.charAt(0)}{member.last_name?.charAt(0)}
                                  </div>
                                )}
                                <span>{member.first_name} {member.last_name}</span>
                                {isTagged && <span style={{ marginLeft: 'auto', color: 'var(--vine-green)', fontSize: '0.7rem' }}>Tagged</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Album Selection or Photo Selection */}
      <div className="settings-content-panel">
        {!selectedAlbum ? (
          <>
            <h4 className="font-medium mb-3" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
              Select an Album
            </h4>

            {/* Album Search Bar — Gilded Vellum */}
            {albums.length > 0 && (
              <div className="hero-album-search-wrap mb-4">
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--vine-sage)' }} />
                <input
                  type="text"
                  value={albumSearchQuery}
                  onChange={(e) => setAlbumSearchQuery(e.target.value)}
                  placeholder="Search albums..."
                  className="hero-album-search-input"
                />
                {albumSearchQuery && (
                  <button
                    onClick={() => setAlbumSearchQuery('')}
                    className="p-0.5 rounded-full hover:bg-vine-100 transition-colors"
                  >
                    <X className="w-3 h-3" style={{ color: 'var(--vine-sage)' }} />
                  </button>
                )}
              </div>
            )}

            {albums.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No albums found.</p>
                <p className="text-gray-400 text-sm mt-2">
                  Create albums and upload photos first.
                </p>
              </div>
            ) : (
              <div className="hero-album-list">
                {albums
                  .filter(a => !albumSearchQuery || a.title.toLowerCase().includes(albumSearchQuery.toLowerCase()))
                  .map((album) => (
                  <button
                    key={album.id}
                    onClick={() => handleAlbumClick(album)}
                    className="text-left hero-album-card"
                  >
                    <div className="flex items-center gap-3">
                      <PhotoStackPreview album={album} />
                      <div className="flex-1 min-w-0">
                        <h5 className="hero-album-title">
                          {album.title}
                        </h5>
                        <p className="text-[0.65rem] font-inter" style={{ color: 'var(--vine-sage)' }}>
                          {album.photo_count || 0} photos
                          {album.event_date && ` · ${new Date(album.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {albums.filter(a => !albumSearchQuery || a.title.toLowerCase().includes(albumSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-center py-6 text-sm" style={{ color: 'var(--vine-sage)', fontFamily: 'var(--font-body)' }}>
                    No albums match "{albumSearchQuery}"
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleBackToAlbums}
                className="hero-album-breadcrumb-back"
              >
                ← Back to All Albums
              </button>
              <span style={{ color: 'rgba(212, 175, 55, 0.4)' }}>/</span>
              <span className="font-medium text-sm" style={{ color: 'var(--vine-dark)', fontFamily: 'var(--font-header)' }}>
                {selectedAlbum.title}
              </span>
            </div>

            {/* Photos in Album */}
            {loadingPhotos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-vine-500 border-t-transparent mx-auto mb-4"></div>
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
                            ? 'border-vine-500 ring-2 ring-vine-200'
                            : 'border-gray-200 hover:border-vine-300'
                        }`}
                      >
                        <img
                          src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                          alt={photo.caption || 'Gallery photo'}
                          className="w-full h-24 object-cover"
                          loading="lazy"
                        />

                        {alreadySelected && (
                          <div className="absolute top-2 right-2 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs" style={{ background: 'var(--vine-green)' }}>
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
                                  className="hero-photo-add-btn"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => handleCropPhoto(photo)}
                                  disabled={saving}
                                  className="hero-photo-crop-btn"
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

      {/* Photo Cropper Modal - with 3:2 aspect ratio and homepage preview */}
      {showCropper && cropImageFile && selectedPhotoForCrop && (
        <PhotoCropper
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={3/2}
          title="Crop Hero Image (3:2 Landscape)"
          description="Crop the image to a 3:2 landscape format to match the homepage display."
          showPreview={true}
          PreviewComponent={HeroPreviewModal}
        />
      )}

      {/* Preview Homepage Modal */}
      {showPreview && selectedImages.length > 0 && (
        <div className="curator-preview-modal" onClick={() => setShowPreview(false)}>
          <div className="curator-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="curator-preview-header">
              <h3>Homepage Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="curator-action-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="curator-preview-body">
              {/* Storybook Preview */}
              <div className="storybook-hero" style={{ minHeight: '400px' }}>
                {/* Visual */}
                <div className="storybook-visual" style={{ minHeight: '400px' }}>
                  <img
                    src={`${process.env.REACT_APP_API}/${selectedImages[previewSlide]?.file_path}`}
                    alt={selectedImages[previewSlide]?.caption || 'Preview'}
                    className="storybook-artifact-img"
                  />
                  {selectedImages.length > 1 && (
                    <div className="storybook-slide-counter">
                      {previewSlide + 1} / {selectedImages.length}
                    </div>
                  )}
                </div>

                {/* Narrative */}
                <div className="storybook-narrative">
                  <div className="storybook-overline">
                    {selectedImages[previewSlide]?.albumTitle || 'Family Album'}
                  </div>
                  <h2 className="storybook-title">
                    {selectedImages[previewSlide]?.caption || 'A Moment in Time'}
                  </h2>
                  <div className="storybook-divider" />

                  {selectedImages[previewSlide]?.hero_location_override && (
                    <div className="storybook-context-item">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedImages[previewSlide].hero_location_override}</span>
                    </div>
                  )}

                  {selectedImages[previewSlide]?.hero_blurb ? (
                    <p className="storybook-body">
                      {selectedImages[previewSlide].hero_blurb}
                    </p>
                  ) : (
                    <p className="storybook-body storybook-empty-fact">
                      Every photograph holds a story waiting to be told.
                    </p>
                  )}

                  {selectedImages[previewSlide]?.tagged_members?.length > 0 && (
                    <div className="storybook-cast-ribbon">
                      <span className="storybook-cast-label">In this photo</span>
                      <div className="storybook-cast-avatars">
                        {selectedImages[previewSlide].tagged_members.map(member => (
                          <div
                            key={member.id}
                            className="storybook-cast-avatar"
                            title={`${member.first_name} ${member.last_name}`}
                          >
                            {member.photo_url ? (
                              <img
                                src={`${process.env.REACT_APP_API}/${member.photo_url}`}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>{member.first_name?.charAt(0)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="storybook-read-more" style={{ cursor: 'default' }}>
                    Explore the Gallery
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Preview navigation dots */}
              {selectedImages.length > 1 && (
                <div className="hero-leaf-dots" style={{ paddingTop: '12px' }}>
                  {selectedImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPreviewSlide(index)}
                      className={`hero-leaf-dot ${index === previewSlide ? 'hero-leaf-dot-active' : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroImageSelector;
