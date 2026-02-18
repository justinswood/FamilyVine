import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, User, Edit, Trash2, Volume2, Users } from 'lucide-react';
import { useStories, useMembers, useDeleteStory } from '../hooks/useQueries';
import ProfileImage from '../components/ProfileImage';

/* ── Decorative leaf icon matching Chronicle motif ── */
const LeafIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89-.82L7 22l1-3.5C10.5 14 15 11 17 8z" />
    <path d="M17 8C17 8 21 4 21 3c-1 0-5 4-5 4" />
  </svg>
);

const StoriesPage = () => {
  const navigate = useNavigate();
  const { data: stories = [], isLoading: loading, error } = useStories();
  const { data: members = [] } = useMembers();
  const deleteStoryMutation = useDeleteStory();
  const [selectedDecade, setSelectedDecade] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  const handleDelete = async (id) => {
    try {
      await deleteStoryMutation.mutateAsync(id);
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story: ' + error.message);
    }
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
  };

  // Helper to extract year from date string without timezone issues
  const getYearFromDate = (dateString) => {
    if (!dateString) return null;
    return parseInt(dateString.split('T')[0].split('-')[0], 10);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    // Parse date parts manually to avoid timezone shifts
    // (new Date("2025-05-07") is parsed as UTC, which shifts to previous day in US timezones)
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day); // months are 0-indexed
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /* ── Decade extraction for Time-Travel Navigation ── */
  const decades = useMemo(() => {
    const decadeSet = new Set();
    stories.forEach(story => {
      if (story.story_date) {
        const year = getYearFromDate(story.story_date);
        const decade = Math.floor(year / 10) * 10;
        decadeSet.add(decade);
      }
    });
    return Array.from(decadeSet).sort((a, b) => a - b);
  }, [stories]);

  /* ── Filtered stories ── */
  const filteredStories = useMemo(() => {
    let result = stories;

    // Filter by decade
    if (selectedDecade !== 'all') {
      const decadeStart = parseInt(selectedDecade);
      result = result.filter(story => {
        if (!story.story_date) return false;
        const year = getYearFromDate(story.story_date);
        return year >= decadeStart && year < decadeStart + 10;
      });
    }

    return result;
  }, [stories, selectedDecade]);

  /* ── Find member object to deep link author ── */
  const findAuthorMember = (authorName) => {
    if (!authorName) return null;
    const lower = authorName.toLowerCase();
    return members.find(m => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      return fullName === lower || m.first_name.toLowerCase() === lower;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white/80 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vine-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-vine-sage dark:text-secondary-400">Loading the Family Anthology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white/80 dark:bg-secondary-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400">Error: {error?.message || 'Failed to load stories'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-secondary-900 p-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Gilded Vellum Header ── */}
        <div className="anthology-header">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h1 className="anthology-header-title flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Family Anthology
              </h1>
              <p className="anthology-header-subtitle">
                The collected stories, memories &amp; oral histories of our family
              </p>
            </div>
            <button
              onClick={() => navigate('/stories/new')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: 'var(--vine-green, #2E5A2E)',
                color: '#fff',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--vine-dark, #2D4F1E)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--vine-green, #2E5A2E)'}
            >
              <Plus className="w-3 h-3" />
              New Story
            </button>
          </div>

          {/* Gold divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0) 100%)',
            margin: '6px 0 8px',
          }} />

          {/* ── Decade Timeline Navigation (30% reduced) ── */}
          {decades.length > 0 && (
            <div className="decade-timeline">
              <div className="time-travel-label">
                <LeafIcon className="w-2 h-2" />
                <span>Time-Travel</span>
              </div>
              <div className="era-button-group">
                <button
                  onClick={() => setSelectedDecade('all')}
                  className={`decade-pill ${selectedDecade === 'all' ? 'decade-pill-active' : ''}`}
                >
                  All Eras
                </button>
                {decades.map(decade => (
                  <button
                    key={decade}
                    onClick={() => setSelectedDecade(decade === selectedDecade ? 'all' : String(decade))}
                    className={`decade-pill ${String(decade) === selectedDecade ? 'decade-pill-active' : ''}`}
                  >
                    {decade}s
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Story Count ── */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--vine-sage, #86A789)' }}>
            {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            {filteredStories.length !== stories.length && ` of ${stories.length} total`}
          </span>
        </div>

        {/* ── Stories Masonry Grid ── */}
        {filteredStories.length === 0 ? (
          <div className="story-empty-state">
            <BookOpen className="w-20 h-20 mx-auto mb-4" style={{ color: 'var(--vine-sage, #86A789)', opacity: 0.4 }} />
            <h2 style={{
              fontFamily: 'var(--font-header, "Playfair Display", serif)',
              fontSize: '1.5rem',
              color: 'var(--vine-dark, #2D4F1E)',
              marginBottom: '0.5rem',
            }}>
              {selectedDecade === 'all'
                ? 'No stories yet'
                : 'No stories match this era'}
            </h2>
            <p style={{ color: 'var(--vine-sage, #86A789)', marginBottom: '1.5rem' }}>
              {selectedDecade === 'all'
                ? 'Begin your family anthology by recording the first story'
                : 'Try selecting a different decade'}
            </p>
            {selectedDecade === 'all' && (
              <button
                onClick={() => navigate('/stories/new')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--vine-green, #2E5A2E)',
                  color: '#fff',
                  fontFamily: 'var(--font-header, "Playfair Display", serif)',
                }}
              >
                <Plus className="w-5 h-5" />
                Record First Story
              </button>
            )}
          </div>
        ) : (
          <div className="story-masonry">
            {filteredStories.map((story) => {
              const authorMember = findAuthorMember(story.author_name);
              const storyYear = getYearFromDate(story.story_date);

              return (
                <div key={story.id} className="story-manuscript">
                  {/* Manuscript header with date & actions */}
                  <div className="flex items-start justify-between mb-2">
                    {storyYear && (
                      <span className="story-manuscript-year">{storyYear}</span>
                    )}
                    <div className="flex gap-0.5 ml-auto">
                      <button
                        onClick={() => navigate(`/stories/${story.id}/edit`)}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Edit story"
                        style={{ color: 'var(--vine-sage, #86A789)' }}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(story)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-400 hover:text-red-600"
                        title="Delete story"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Serif title */}
                  <Link to={`/stories/${story.id}`} className="block group">
                    <h3 className="story-manuscript-title group-hover:opacity-80 transition-opacity">
                      {story.title}
                    </h3>
                  </Link>

                  {/* Gold divider */}
                  <div style={{
                    height: '1px',
                    background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0) 100%)',
                    margin: '7px 0',
                  }} />

                  {/* Typewriter excerpt */}
                  <Link to={`/stories/${story.id}`} className="block">
                    <p className="story-manuscript-excerpt">
                      {truncateContent(story.content)}
                    </p>
                  </Link>

                  {/* Author attribution */}
                  {story.author_name && (
                    <div className="flex items-center gap-1.5 mt-2.5" style={{ color: 'var(--vine-sage, #86A789)' }}>
                      {authorMember ? (
                        <Link
                          to={`/members/${authorMember.id}`}
                          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                          style={{ color: 'var(--vine-sage, #86A789)' }}
                        >
                          <ProfileImage member={authorMember} size="small" className="w-4 h-4" />
                          <span className="italic" style={{ fontFamily: 'var(--font-body, "Inter", sans-serif)', fontSize: '0.6rem' }}>Told by {story.author_name}</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span className="italic" style={{ fontFamily: 'var(--font-body, "Inter", sans-serif)', fontSize: '0.6rem' }}>Told by {story.author_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  {story.story_date && (
                    <div className="flex items-center gap-1 mt-1.5" style={{ color: 'var(--vine-sage, #86A789)', fontSize: '0.5rem' }}>
                      <LeafIcon className="w-2.5 h-2.5" />
                      <span>{formatDate(story.story_date)}</span>
                    </div>
                  )}

                  {/* Indicator badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {/* Audio Story indicator */}
                    {story.audio_recordings && story.audio_recordings.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(134, 167, 137, 0.1)',
                          color: 'var(--vine-green, #2E5A2E)',
                          border: '1px solid rgba(134, 167, 137, 0.2)',
                          fontSize: '0.65rem',
                        }}>
                        <Volume2 className="w-3 h-3" />
                        Audio Story
                      </div>
                    )}

                    {/* People mentioned indicator */}
                    {story.members && story.members.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(134, 167, 137, 0.1)',
                          color: 'var(--vine-green, #2E5A2E)',
                          border: '1px solid rgba(134, 167, 137, 0.2)',
                          fontSize: '0.65rem',
                        }}>
                        <Users className="w-3 h-3" />
                        {story.members.length} {story.members.length === 1 ? 'person' : 'people'} mentioned
                      </div>
                    )}

                    {/* Photo count indicator */}
                    {story.photos && story.photos.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: 'rgba(134, 167, 137, 0.1)',
                          color: 'var(--vine-green, #2E5A2E)',
                          border: '1px solid rgba(134, 167, 137, 0.2)',
                          fontSize: '0.65rem',
                        }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        {story.photos.length} {story.photos.length === 1 ? 'photo' : 'photos'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
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
              Are you sure you want to remove &ldquo;{showDeleteModal.title}&rdquo; from the family anthology?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--vine-dark, #2D4F1E)' }}
              >
                Keep Story
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
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

export default StoriesPage;
