import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Users, Edit, Trash2, BookOpen, Printer } from 'lucide-react';
import ProfileImage from '../components/ProfileImage';
import AudioPlayer from '../components/AudioPlayer';

/* ── Decorative leaf icon ── */
const LeafIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.82L7 22l1-3.5C10.5 14 15 11 17 8z" />
    <path d="M17 8C17 8 21 4 21 3c-1 0-5 4-5 4" />
  </svg>
);

const StoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const API_URL = process.env.REACT_APP_API ?? '';

  useEffect(() => {
    fetchStory();
    fetchMembers();
  }, [id]);

  const fetchStory = async () => {
    try {
      const token = localStorage.getItem('familyVine_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/stories/${id}`, { headers });
      if (!response.ok) throw new Error('Story not found');
      const data = await response.json();
      setStory(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching story:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('familyVine_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/stories/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to delete story');
      navigate('/stories');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story: ' + error.message);
    }
  };

  // Helper to extract year from date string without timezone issues
  const getYearFromDate = (dateString) => {
    if (!dateString) return null;
    return parseInt(dateString.split('T')[0].split('-')[0], 10);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unknown';
    // Parse date parts manually to avoid timezone shifts
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day); // months are 0-indexed
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLifespan = (birth, death) => {
    const b = birth ? getYearFromDate(birth) : '?';
    const d = death ? getYearFromDate(death) : null;
    if (d) return `${b}\u2013${d}`;
    if (b !== '?') return `b. ${b}`;
    return '';
  };

  /* ── Find member object for author deep link ── */
  const authorMember = useMemo(() => {
    if (!story?.author_name || members.length === 0) return null;
    const lower = story.author_name.toLowerCase();
    return members.find(m => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      return fullName === lower || m.first_name.toLowerCase() === lower;
    });
  }, [story, members]);

  /* ── Split content into paragraphs for drop cap and reading flow ── */
  const contentParagraphs = useMemo(() => {
    if (!story?.content) return [];
    return story.content.split(/\n\s*\n/).filter(p => p.trim());
  }, [story]);

  const handlePrint = () => {
    window.print();
  };

  const storyYear = story?.story_date ? getYearFromDate(story.story_date) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vine-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-vine-sage dark:text-secondary-400">Opening the anthology...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-24 h-24 mx-auto mb-4" style={{ color: 'var(--vine-sage, #86A789)', opacity: 0.3 }} />
          <h2 style={{
            fontFamily: 'var(--font-header, "Playfair Display", serif)',
            fontSize: '1.75rem',
            color: 'var(--vine-dark, #2D4F1E)',
            marginBottom: '0.5rem',
          }}>
            Story not found
          </h2>
          <p style={{ color: 'var(--vine-sage, #86A789)', marginBottom: '1.5rem' }}>
            {error || 'This page of the anthology could not be found.'}
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all"
            style={{
              backgroundColor: 'var(--vine-green, #2E5A2E)',
              color: '#fff',
            }}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Anthology
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-secondary-900 p-6 story-crossfade-enter">
      <div className="max-w-6xl mx-auto">

        {/* ── Toolbar ── */}
        <div className="story-view-toolbar">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--vine-green, #2E5A2E)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Anthology
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Print Story"
              style={{ color: 'var(--vine-sage, #86A789)' }}
            >
              <Printer className="w-4 h-4" />
            </button>
            <Link
              to={`/stories/${id}/edit`}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Edit Story"
              style={{ color: 'var(--vine-sage, #86A789)' }}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-400 hover:text-red-600"
              title="Delete Story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main Content Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Reading Panel (Main Column) ── */}
          <div className="flex-1 min-w-0">
            <div className="story-reading-panel">

              {/* ── Gilded Vellum Title Page (Centered) ── */}
              <div className="story-header-container">
                {/* Year badge */}
                {storyYear && (
                  <div className="flex items-center gap-2 mb-3 justify-center">
                    <LeafIcon className="w-4 h-4" style={{ color: 'var(--vine-sage, #86A789)' }} />
                    <span style={{
                      fontFamily: 'var(--font-header, "Playfair Display", serif)',
                      fontSize: '0.85rem',
                      color: 'var(--vine-sage, #86A789)',
                      letterSpacing: '0.05em',
                    }}>
                      {storyYear}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h1 style={{
                  fontFamily: 'var(--font-header, "Playfair Display", serif)',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--vine-dark, #2D4F1E)',
                  lineHeight: 1.2,
                  marginBottom: '0.75rem',
                }}>
                  {story.title}
                </h1>

                {/* Gold divider */}
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: 'linear-gradient(to right, var(--gold-accent, #D4A017), transparent)',
                  margin: '12px auto 16px',
                }} />

                {/* Metadata badges */}
                <div className="story-metadata-badges">
                  {story.story_date && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: 'rgba(134, 167, 137, 0.1)',
                        color: 'var(--vine-green, #2E5A2E)',
                        border: '1px solid rgba(134, 167, 137, 0.2)',
                      }}>
                      <Calendar className="w-3 h-3" />
                      {formatDate(story.story_date)}
                    </div>
                  )}

                  {story.author_name && (
                    <div className="inline-flex items-center gap-1.5 text-xs"
                      style={{ color: 'var(--vine-sage, #86A789)' }}>
                      {authorMember ? (
                        <Link
                          to={`/members/${authorMember.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: 'rgba(134, 167, 137, 0.1)',
                            color: 'var(--vine-green, #2E5A2E)',
                            border: '1px solid rgba(134, 167, 137, 0.2)',
                          }}
                        >
                          <ProfileImage member={authorMember} size="small" className="w-4 h-4" />
                          Told by {story.author_name}
                        </Link>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: 'rgba(134, 167, 137, 0.1)',
                            color: 'var(--vine-green, #2E5A2E)',
                            border: '1px solid rgba(134, 167, 137, 0.2)',
                          }}>
                          <User className="w-3 h-3" />
                          Told by {story.author_name}
                        </div>
                      )}
                    </div>
                  )}

                  {story.members && story.members.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: 'rgba(134, 167, 137, 0.1)',
                        color: 'var(--vine-green, #2E5A2E)',
                        border: '1px solid rgba(134, 167, 137, 0.2)',
                      }}>
                      <Users className="w-3 h-3" />
                      {story.members.length} {story.members.length === 1 ? 'person' : 'people'} mentioned
                    </div>
                  )}
                </div>
              </div>

              {/* ── Audio Players (if audio recordings exist) ── */}
              {story.audio_recordings && story.audio_recordings.length > 0 && (
                <div style={{ padding: '0 36px 24px' }}>
                  {story.audio_recordings
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((recording, index) => (
                      <div key={recording.id} style={{ marginBottom: index < story.audio_recordings.length - 1 ? '12px' : 0 }}>
                        {recording.title && (
                          <p style={{
                            fontFamily: 'var(--font-header, "Playfair Display", serif)',
                            fontSize: '0.85rem',
                            color: 'var(--vine-dark, #2D4F1E)',
                            marginBottom: '6px',
                            fontWeight: 600,
                          }}>
                            {recording.title}
                          </p>
                        )}
                        <AudioPlayer
                          audioUrl={recording.audio_url}
                          duration={recording.audio_duration}
                          transcript={index === 0 ? story.transcript : null}
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* ── Story Body with Drop Cap ── */}
              <div className="story-body">
                {contentParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={index === 0 ? 'story-drop-cap' : ''}
                    style={{ marginBottom: '1.25rem' }}
                  >
                    {paragraph.trim()}
                  </p>
                ))}
              </div>

              {/* ── Archival Photo Gallery ── */}
              {story.photos && story.photos.length > 0 && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(134, 167, 137, 0.12)' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-header, "Playfair Display", serif)',
                    fontSize: '1.25rem',
                    color: 'var(--vine-dark, #2D4F1E)',
                    marginBottom: '1rem',
                  }}>
                    Photographs
                  </h2>
                  <div className="story-photo-gallery">
                    {story.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="story-photo-item"
                        onClick={() => setSelectedPhoto(photo)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPhoto(photo); }}
                      >
                        <img
                          src={`${API_URL}${photo.file_path}`}
                          alt={photo.caption || 'Story photo'}
                          className="w-full h-48 object-cover rounded"
                          style={{
                            filter: 'sepia(0.06) contrast(1.04)',
                            transition: 'filter 0.4s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.filter = 'sepia(0) contrast(1)'}
                          onMouseLeave={e => e.currentTarget.style.filter = 'sepia(0.06) contrast(1.04)'}
                        />
                        {photo.caption && (
                          <p className="mt-1.5 text-xs italic" style={{ color: 'var(--vine-sage, #86A789)' }}>
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Transcript below story body (if exists and audio recordings present) ── */}
              {story.audio_recordings && story.audio_recordings.length > 0 && story.transcript && (
                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(134, 167, 137, 0.12)' }}>
                  <h2 style={{
                    fontFamily: 'var(--font-header, "Playfair Display", serif)',
                    fontSize: '1.25rem',
                    color: 'var(--vine-dark, #2D4F1E)',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Transcript
                  </h2>
                  <div className="vellum-scroll">
                    <p className="vellum-scroll-text">{story.transcript}</p>
                  </div>
                </div>
              )}

              {/* Gold end divider */}
              <div style={{
                height: '1px',
                background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0) 100%)',
                margin: '2rem 0 1rem',
              }} />

              {/* Fleur-de-lis end mark */}
              <div className="text-center" style={{ color: 'rgba(212, 175, 55, 0.4)', fontSize: '1.5rem' }}>
                &#9884;
              </div>
            </div>
          </div>

          {/* ── Who's Mentioned Sidebar ── */}
          {story.members && story.members.length > 0 && (
            <div className="lg:w-72 flex-shrink-0">
              <div className="story-mentioned-panel lg:sticky lg:top-6">
                <h3 className="story-mentioned-title">
                  <Users className="w-4 h-4" style={{ color: 'var(--vine-sage, #86A789)' }} />
                  Who&rsquo;s Mentioned
                </h3>

                {/* Gold divider */}
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0) 100%)',
                  margin: '8px 0 16px',
                }} />

                <div className="mentioned-members-grid">
                  {story.members.map((member) => (
                    <Link
                      key={member.id}
                      to={`/members/${member.id}`}
                      className="mentioned-member-item group"
                    >
                      <ProfileImage
                        member={member}
                        size="small"
                        className="mentioned-member-photo"
                      />
                      <span className="story-mentioned-name group-hover:opacity-80 transition-opacity">
                        {member.first_name} {member.last_name}
                      </span>
                      {(member.birth_date || member.death_date) && (
                        <span className="text-xs" style={{ color: 'var(--vine-sage, #86A789)' }}>
                          {formatLifespan(member.birth_date, member.death_date)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* View in tree link */}
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(134, 167, 137, 0.1)' }}>
                  <Link
                    to="/tree"
                    className="flex items-center gap-2 text-xs transition-colors"
                    style={{ color: 'var(--vine-green, #2E5A2E)' }}
                  >
                    <LeafIcon className="w-3.5 h-3.5" />
                    View in Family Tree
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Photo Lightbox ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={`${API_URL}${selectedPhoto.file_path}`}
              alt={selectedPhoto.caption || 'Story photo'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {selectedPhoto.caption && (
              <p className="text-center mt-3 text-white/80 text-sm italic">
                {selectedPhoto.caption}
              </p>
            )}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="story-delete-modal">
            <h3 style={{
              fontFamily: 'var(--font-header, "Playfair Display", serif)',
              fontSize: '1.25rem',
              color: 'var(--vine-dark, #2D4F1E)',
              marginBottom: '0.75rem',
            }}>
              Remove from Anthology?
            </h3>
            <p style={{ color: 'var(--vine-sage, #86A789)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Are you sure you want to remove &ldquo;{story.title}&rdquo; from the family anthology?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--vine-dark, #2D4F1E)' }}
              >
                Keep Story
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;
