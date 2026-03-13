import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbums, useCreateAlbum } from '../hooks/useQueries';
import ProfileImage from '../components/ProfileImage';

/* ── Tagged Members Ribbon ── */
const TaggedMembersRibbon = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <div className="gallery-tagged-ribbon">
        <span className="gallery-tag-prompt">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Tag Family Members
        </span>
      </div>
    );
  }

  return (
    <div className="gallery-tagged-ribbon">
      <div className="avatar-stack">
        {members.slice(0, 5).map((member) => (
          <ProfileImage
            key={member.id}
            member={member}
            size="w-8 h-8"
            className="rounded-full border-2 border-white shadow-sm ring-1 ring-black/5 dark:border-gray-800 dark:ring-white/10"
          />
        ))}
        {members.length > 5 && (
          <div className="avatar-overflow">
            +{members.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Leaf SVG Icon (matches Chronicle leaf motif) ── */
const LeafIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const Gallery = () => {
  const { data: albums = [], isLoading: loading } = useAlbums();
  const createAlbumMutation = useCreateAlbum();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    event_date: '',
    is_public: true
  });

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      await createAlbumMutation.mutateAsync(newAlbum);
      setNewAlbum({ title: '', description: '', event_date: '', is_public: true });
      setShowCreateForm(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-3 border-vine-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="gallery-archival-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" className="text-vine-300 dark:text-gray-700" fill="currentColor" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#gallery-archival-pattern)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">

        {/* Gallery Header — Gilded Vellum Ribbon */}
        <div className="gallery-header mb-4">
          <div className="flex flex-row justify-between items-center gap-1.5">
            <div className="min-w-0">
              <h1 className="recipe-header-title truncate">Family Archive</h1>
              <p className="mt-0.5 tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)', fontSize: '0.6rem' }}>
                Preserving memories across generations
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full font-medium transition-all shrink-0"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#fffdf9',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(45, 79, 30, 0.35)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(45, 79, 30, 0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg className="w-2 h-2 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-[8px] sm:text-xs">Create Album</span>
            </button>
          </div>
        </div>

        {/* Create Album Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[60] p-3 overflow-y-auto">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-4 rounded-xl max-w-sm w-full shadow-2xl border border-white/50 dark:border-gray-700 my-auto">
              <h2 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
                Create New Album
              </h2>
              <form onSubmit={handleCreateAlbum} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium mb-1 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Album Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newAlbum.title}
                    onChange={handleInputChange}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
                    placeholder="e.g., Christmas 1952"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newAlbum.description}
                    onChange={handleInputChange}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-3 py-2 h-16 text-sm bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all resize-none"
                    placeholder="Historical context for this collection..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-vine-600 dark:text-vine-400" style={{ fontFamily: 'var(--font-body)' }}>
                    Historical Date
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={newAlbum.event_date}
                    onChange={handleInputChange}
                    className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_public"
                    checked={newAlbum.is_public}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-vine-600 bg-white border-vine-200 rounded focus:ring-vine-500 focus:ring-2"
                  />
                  <label className="text-xs text-vine-dark dark:text-gray-300">Make album public</label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all"
                    style={{
                      background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                      boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
                    }}
                  >
                    Create Album
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-vine-200 dark:border-gray-600 text-vine-dark dark:text-gray-300 hover:bg-vine-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Albums — Masonry Grid */}
        {albums.length === 0 ? (
          <div className="gallery-empty-state max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--vine-sage)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
              No Albums Yet
            </h3>
            <p className="text-sm mb-5" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>
              Create your first album to start preserving your family's visual history.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#fffdf9',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
            >
              Create First Album
            </button>
          </div>
        ) : (
          <div className="gallery-masonry">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/gallery/${album.id}`}
                className="gallery-album-card block"
              >
                {/* Cover image with heirloom filter */}
                <div className="gallery-cover-container">
                  {album.cover_photo_path ? (
                    <img
                      src={`${process.env.REACT_APP_API}/${album.cover_photo_path}`}
                      alt={album.title}
                      className={`heirloom-img${album.cover_photo_rotation === 90 ? ' rotated-90' : ''}${album.cover_photo_rotation === 180 ? ' rotated-180' : ''}${album.cover_photo_rotation === 270 ? ' rotated-270' : ''}`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="gallery-no-cover">
                      <LeafIcon className="w-10 h-10 mb-2 opacity-40" />
                      <span className="text-xs font-medium opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
                        No cover photo
                      </span>
                    </div>
                  )}

                  {/* Photo count badge */}
                  <div className="gallery-photo-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    {album.photo_count || 0}
                  </div>
                </div>

                {/* Content */}
                <div className="gallery-card-content">
                  <h3 className="gallery-card-title">{album.title}</h3>

                  {album.description && (
                    <p className="gallery-card-description">{album.description}</p>
                  )}

                  {/* Metadata row */}
                  <div className="gallery-card-meta">
                    <div className="gallery-card-meta-item">
                      <LeafIcon className="w-3.5 h-3.5" />
                      {album.photo_count || 0} photos
                    </div>

                    {album.event_date && (
                      <span className="gallery-card-meta-date">
                        {formatDate(album.event_date)}
                      </span>
                    )}
                  </div>

                  {/* Tagged Members Ribbon */}
                  <TaggedMembersRibbon members={album.tagged_members} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
