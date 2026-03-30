import { useState, useEffect } from 'react';
import { ChevronLeft, Image, X, Check } from 'lucide-react';
import axios from 'axios';

const PhotoGalleryPicker = ({ onPhotoSelect, onCancel }) => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      // Only show albums that have photos
      setAlbums(res.data.filter(a => Number(a.photo_count) > 0));
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlbumClick = async (album) => {
    try {
      setLoadingPhotos(true);
      setSelectedAlbum(album);
      setSelectedPhoto(null);
      const res = await axios.get(`${process.env.REACT_APP_API}/api/albums/${album.id}`);
      setAlbumPhotos(res.data.photos || []);
    } catch (error) {
      console.error('Error fetching album photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleBack = () => {
    setSelectedAlbum(null);
    setAlbumPhotos([]);
    setSelectedPhoto(null);
  };

  const handleConfirmSelection = () => {
    if (selectedPhoto) {
      onPhotoSelect(selectedPhoto.file_path);
    }
  };

  const Spinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vine-600 mb-3"></div>
      <p className="text-sm text-vine-sage">Loading...</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-vine-200 dark:border-secondary-700 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {selectedAlbum && (
                <button
                  onClick={handleBack}
                  className="p-1.5 rounded-lg hover:bg-vine-50 dark:hover:bg-secondary-700 transition-colors text-vine-600 dark:text-vine-400"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-vine-dark dark:text-white font-heading">
                  {selectedAlbum ? selectedAlbum.title : 'Choose from Gallery'}
                </h2>
                <p className="text-vine-sage dark:text-secondary-400 text-xs mt-0.5">
                  {selectedAlbum
                    ? `${albumPhotos.length} photo${albumPhotos.length !== 1 ? 's' : ''} — tap to select`
                    : 'Select an album to browse photos'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg hover:bg-vine-50 dark:hover:bg-secondary-700 transition-colors text-vine-sage"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <Spinner />
          ) : !selectedAlbum ? (
            /* ── Album Grid ── */
            albums.length === 0 ? (
              <div className="text-center py-12">
                <Image className="w-12 h-12 text-vine-200 mx-auto mb-3" />
                <p className="text-vine-sage dark:text-secondary-400">No albums with photos found.</p>
                <p className="text-vine-sage dark:text-secondary-500 text-sm mt-1">
                  Upload photos to albums first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => handleAlbumClick(album)}
                    className="group relative rounded-xl overflow-hidden border border-vine-200 dark:border-secondary-600
                               hover:border-vine-400 dark:hover:border-vine-600 transition-all text-left
                               hover:shadow-md focus:outline-none focus:ring-2 focus:ring-vine-400"
                  >
                    {/* Cover image */}
                    <div className="aspect-[4/3] bg-vine-50 dark:bg-secondary-700">
                      {album.cover_photo_path ? (
                        <img
                          src={`${process.env.REACT_APP_API}/${album.cover_photo_path}`}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : album.recent_photos && album.recent_photos.length > 0 ? (
                        <img
                          src={`${process.env.REACT_APP_API}/${album.recent_photos[0].file_path}`}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-vine-200 dark:text-secondary-500" />
                        </div>
                      )}
                    </div>
                    {/* Album info overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                      <p className="text-white text-sm font-medium truncate">{album.title}</p>
                      <p className="text-white/70 text-xs">
                        {album.photo_count} photo{Number(album.photo_count) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : loadingPhotos ? (
            <Spinner />
          ) : (
            /* ── Photo Grid (within selected album) ── */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {albumPhotos.map((photo) => {
                const isSelected = selectedPhoto?.id === photo.id;
                return (
                  <button
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square
                               focus:outline-none focus:ring-2 focus:ring-vine-400
                               ${isSelected
                                 ? 'border-vine-600 dark:border-vine-400 ring-2 ring-vine-200 dark:ring-vine-800 scale-[0.97]'
                                 : 'border-transparent hover:border-vine-300 dark:hover:border-vine-600'
                               }`}
                  >
                    <img
                      src={`${process.env.REACT_APP_API}/${photo.file_path}`}
                      alt={photo.caption || 'Photo'}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-vine-600/20 flex items-center justify-center">
                        <div className="bg-vine-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                    {photo.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                        <p className="text-white text-[10px] truncate">{photo.caption}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — only show when browsing photos */}
        {selectedAlbum && (
          <div className="p-3 border-t border-vine-200 dark:border-secondary-700 bg-vine-50/50 dark:bg-secondary-900/50 shrink-0">
            <div className="flex justify-between items-center">
              <p className="text-xs text-vine-sage dark:text-secondary-400">
                {selectedPhoto
                  ? `Selected${selectedPhoto.caption ? `: ${selectedPhoto.caption}` : ''}`
                  : 'Tap a photo to select it'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 text-sm text-vine-sage hover:text-vine-dark border border-vine-200 dark:border-secondary-600 rounded-lg hover:bg-vine-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedPhoto}
                  className="px-4 py-1.5 text-sm bg-vine-600 text-white rounded-lg hover:bg-vine-700 disabled:bg-secondary-300 dark:disabled:bg-secondary-600 disabled:cursor-not-allowed transition-colors"
                >
                  Use This Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGalleryPicker;
