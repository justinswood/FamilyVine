import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Feather, Search, X, RefreshCw } from 'lucide-react';
import ProfileImage from '../components/ProfileImage';
import VoiceRecorder from '../components/VoiceRecorder';

/* ── Story Spark Prompts ── */
const STORY_PROMPTS = [
  "What's a holiday tradition only your family would understand?",
  "Describe the smell of a grandparent's kitchen.",
  "What's the funniest thing a family member ever said at dinner?",
  "Tell about a road trip that didn't go as planned.",
  "What family recipe has been passed down through generations?",
  "Describe the house you grew up in — the sounds, the light.",
  "What's a story your parents always told about their childhood?",
  "Who was the family storyteller, and what was their best tale?",
  "What's a lesson a family elder taught you without words?",
  "Describe a moment when the whole family laughed together.",
  "What family photograph tells the best story?",
  "What did Sunday mornings look like in your family?",
  "Tell about a time a family member surprised everyone.",
  "What was the most memorable family reunion?",
  "Describe the sounds of your childhood home.",
  "What family saying or phrase do you still use today?",
  "Who in your family had the most interesting career?",
  "What was the bravest thing a family member ever did?",
  "Describe a family garden, yard, or favorite outdoor place.",
  "What's a secret talent someone in your family had?",
];

const AddEditStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    story_date: '',
    member_ids: [],
    photo_ids: [],
    historical_context: '',
    transcript: ''
  });

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Autocomplete states
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const authorInputRef = useRef(null);
  const titleRef = useRef(null);

  // Title character limits
  const TITLE_MAX = 100;
  const TITLE_SOFT = 60;

  // Story Spark
  const [sparkIndex, setSparkIndex] = useState(() => Math.floor(Math.random() * STORY_PROMPTS.length));

  // Auto-save timer
  const autoSaveTimerRef = useRef(null);
  const lastSavedRef = useRef('');

  // Audio state
  const [audioRecordings, setAudioRecordings] = useState([]);
  // Pending audio for new stories (not yet uploaded)
  const [pendingAudio, setPendingAudio] = useState([]);

  useEffect(() => {
    fetchMembers();
    if (isEditing) {
      fetchStory();
    }
  }, [id]);

  // Close author suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (authorInputRef.current && !authorInputRef.current.contains(event.target)) {
        setShowAuthorSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!formData.title && !formData.content) return;
    const draftKey = isEditing ? `story-draft-${id}` : 'story-draft-new';
    const currentDraft = JSON.stringify(formData);

    if (currentDraft === lastSavedRef.current) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem(draftKey, currentDraft);
      lastSavedRef.current = currentDraft;
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [formData, id, isEditing]);

  // Load draft on mount (only for new stories)
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem('story-draft-new');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed);
        } catch (e) {
          // ignore invalid draft
        }
      }
    }
  }, [isEditing]);

  // Auto-resize title textarea on content change or load
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'inherit';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [formData.title]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length > TITLE_MAX) return; // hard limit
    setFormData(prev => ({ ...prev, title: value }));
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API ?? ''}/api/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchStory = async () => {
    try {
      const token = localStorage.getItem('familyVine_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.REACT_APP_API ?? ''}/api/stories/${id}`, {
        headers
      });

      if (!response.ok) throw new Error('Story not found');

      const data = await response.json();
      setFormData({
        title: data.title || '',
        content: data.content || '',
        author_name: data.author_name || '',
        story_date: data.story_date ? data.story_date.split('T')[0] : '',
        member_ids: data.members ? data.members.map(m => m.id) : [],
        photo_ids: data.photos ? data.photos.map(p => p.id) : [],
        historical_context: data.historical_context || '',
        transcript: data.transcript || ''
      });
      setAudioRecordings(data.audio_recordings || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching story:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAuthorNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, author_name: value }));

    if (value.trim()) {
      const filtered = members.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        return fullName.includes(value.toLowerCase());
      });
      setAuthorSuggestions(filtered);
      setShowAuthorSuggestions(filtered.length > 0);
    } else {
      setAuthorSuggestions([]);
      setShowAuthorSuggestions(false);
    }
  };

  const selectAuthorSuggestion = (member) => {
    setFormData(prev => ({
      ...prev,
      author_name: `${member.first_name} ${member.last_name}`
    }));
    setShowAuthorSuggestions(false);
    setAuthorSuggestions([]);
  };

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      member_ids: prev.member_ids.includes(memberId)
        ? prev.member_ids.filter(mid => mid !== memberId)
        : [...prev.member_ids, memberId]
    }));
  };

  const shuffleSpark = useCallback(() => {
    setSparkIndex(prev => {
      let next;
      do { next = Math.floor(Math.random() * STORY_PROMPTS.length); } while (next === prev);
      return next;
    });
  }, []);

  const handleAudioSaved = useCallback((newAudio, deletedAudioId) => {
    if (deletedAudioId) {
      // A recording was deleted
      setAudioRecordings(prev => prev.filter(r => r.id !== deletedAudioId));
    } else if (newAudio) {
      // A new recording was added
      setAudioRecordings(prev => [...prev, newAudio]);
    }
  }, []);

  // Handle pending audio for new stories
  const handlePendingAudioAdd = useCallback((audioData) => {
    setPendingAudio(prev => [...prev, audioData]);
  }, []);

  const handlePendingAudioRemove = useCallback((audioId) => {
    setPendingAudio(prev => {
      const audio = prev.find(a => a.id === audioId);
      if (audio?.previewUrl) {
        URL.revokeObjectURL(audio.previewUrl);
      }
      return prev.filter(a => a.id !== audioId);
    });
  }, []);

  // Upload pending audio files after story creation
  const uploadPendingAudio = async (storyId) => {
    const token = localStorage.getItem('familyVine_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    for (const audio of pendingAudio) {
      try {
        const formData = new FormData();
        formData.append('audio', audio.blob, audio.fileName);
        if (audio.duration) {
          formData.append('duration', String(audio.duration));
        }

        await fetch(`${process.env.REACT_APP_API ?? ''}/api/stories/${storyId}/audio`, {
          method: 'POST',
          headers,
          body: formData,
        });
      } catch (err) {
        console.error('Failed to upload audio:', err);
      }

      // Clean up preview URL
      if (audio.previewUrl) {
        URL.revokeObjectURL(audio.previewUrl);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isEditing
        ? `${process.env.REACT_APP_API ?? ''}/api/stories/${id}`
        : `${process.env.REACT_APP_API ?? ''}/api/stories`;

      const token = localStorage.getItem('familyVine_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save story');

      const savedStory = await response.json();

      // Clear draft on successful save
      const draftKey = isEditing ? `story-draft-${id}` : 'story-draft-new';
      localStorage.removeItem(draftKey);

      // If creating new story and there's pending audio, upload it
      if (!isEditing && pendingAudio.length > 0) {
        await uploadPendingAudio(savedStory.id);
      }

      navigate(`/stories/${savedStory.id}`);
    } catch (error) {
      console.error('Error saving story:', error);
      setError(error.message);
      setSaving(false);
    }
  };

  // Filter members based on search
  const filteredMembers = members.filter(member => {
    if (!peopleSearchQuery.trim()) return true;
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(peopleSearchQuery.toLowerCase());
  });

  // Get tagged member objects for preview pills
  const taggedMembers = members.filter(m => formData.member_ids.includes(m.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vine-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>Loading manuscript...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-secondary-900" style={{ padding: '12px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Vine-green Breadcrumb */}
        <Link
          to={isEditing ? `/stories/${id}` : '/stories'}
          className="inline-flex items-center gap-2 mb-2"
          style={{
            fontFamily: 'var(--font-body, "Inter", sans-serif)',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--vine-green, #2E5A2E)',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Anthology
        </Link>

        {/* Gilded Vellum Header */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <Feather style={{ width: '22px', height: '22px', color: 'var(--vine-green, #2E5A2E)' }} />
            <h1 style={{
              fontFamily: 'var(--font-header, "Playfair Display", serif)',
              fontSize: '1.76rem',
              fontWeight: 700,
              color: 'var(--vine-dark, #2D4F1E)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {isEditing ? 'Edit Story' : "Writer's Desk"}
            </h1>
          </div>
          {/* Gold divider */}
          <div style={{
            width: '160px',
            height: '1px',
            margin: '0 auto',
            background: 'linear-gradient(to right, rgba(212,175,55,0) 0%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0) 100%)',
          }} />
        </div>

        {/* Main Layout: Desk + Sidebar */}
        <div className="writers-desk-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* ─── LEFT: Writer's Desk Panel ─── */}
          <form onSubmit={handleSubmit} className="writers-desk" style={{ flex: 1, minWidth: 0 }}>

            {error && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 14px',
                background: 'rgba(220, 38, 38, 0.06)',
                border: '1px solid rgba(220, 38, 38, 0.15)',
                borderRadius: '8px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: '#b91c1c',
              }}>
                {error}
              </div>
            )}

            {/* Title — Auto-expanding Vellum Textarea */}
            <div style={{ marginBottom: '18px', position: 'relative' }}>
              <label className="writer-label">Title *</label>
              <textarea
                ref={titleRef}
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                required
                rows={1}
                maxLength={TITLE_MAX}
                className="vellum-title-input"
                placeholder="Give your story a title..."
              />
              <div className={`vellum-title-counter${formData.title.length >= TITLE_MAX ? ' at-limit' : formData.title.length >= TITLE_SOFT ? ' near-limit' : ''}`}>
                {formData.title.length} / {TITLE_MAX}
              </div>
            </div>

            {/* Story Content */}
            <div style={{ marginBottom: '18px' }}>
              <label className="writer-label">Your Story *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={7}
                className="story-textarea"
                placeholder="Begin writing your family story here..."
              />
            </div>

            {/* Gold Divider */}
            <div className="writer-divider" />

            {/* Author + Date row */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '18px', flexWrap: 'wrap' }}>

              {/* Author with Autocomplete */}
              <div style={{ flex: '1 1 260px', position: 'relative' }} ref={authorInputRef}>
                <label className="writer-label">Told By</label>
                <input
                  type="text"
                  name="author_name"
                  value={formData.author_name}
                  onChange={handleAuthorNameChange}
                  onFocus={() => {
                    if (formData.author_name.trim() && authorSuggestions.length > 0) {
                      setShowAuthorSuggestions(true);
                    }
                  }}
                  className="writer-input"
                  placeholder="Who told this story?"
                  autoComplete="off"
                />
                <span className="writer-hint">Start typing to search family members</span>

                {/* Autocomplete Dropdown */}
                {showAuthorSuggestions && authorSuggestions.length > 0 && (
                  <div className="writer-autocomplete">
                    {authorSuggestions.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => selectAuthorSuggestion(member)}
                        className="writer-autocomplete-item"
                      >
                        <ProfileImage member={member} size="small" className="w-6 h-6" />
                        {member.first_name} {member.last_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Story Date */}
              <div style={{ flex: '0 1 200px' }}>
                <label className="writer-label">When It Happened</label>
                <input
                  type="date"
                  name="story_date"
                  value={formData.story_date}
                  onChange={handleChange}
                  className="writer-input"
                />
                <span className="writer-hint">Date of the memory</span>
              </div>
            </div>

            {/* Gold Divider */}
            <div className="writer-divider" />

            {/* Voice Recording Section */}
            <div style={{ marginBottom: '18px' }}>
              <VoiceRecorder
                storyId={isEditing ? id : null}
                onAudioSaved={handleAudioSaved}
                existingRecordings={audioRecordings}
                pendingMode={!isEditing}
                pendingRecordings={pendingAudio}
                onPendingAudioAdd={handlePendingAudioAdd}
                onPendingAudioRemove={handlePendingAudioRemove}
              />
            </div>

            {/* Transcript (editable) - show if there's audio or a transcript */}
            {(audioRecordings.length > 0 || pendingAudio.length > 0 || formData.transcript) && (
              <div style={{ marginBottom: '18px' }}>
                <label className="writer-label">Transcript</label>
                <textarea
                  name="transcript"
                  value={formData.transcript}
                  onChange={handleChange}
                  rows={6}
                  className="story-textarea"
                  placeholder="Add or edit the audio transcript..."
                  style={{ minHeight: '120px' }}
                />
                <span className="writer-hint">Transcript of the voice recording — appears beneath the audio player</span>
              </div>
            )}

            {/* Gold Divider */}
            <div className="writer-divider" />

            {/* People in this Story */}
            <div style={{ marginBottom: '18px' }}>
              <label className="writer-label">People in This Story</label>

              {/* Tagged Members Preview Pills */}
              {taggedMembers.length > 0 && (
                <div className="writer-tagged-grid">
                  {taggedMembers.map(member => (
                    <span
                      key={member.id}
                      className="writer-tagged-member"
                      onClick={() => handleMemberToggle(member.id)}
                      title={`Remove ${member.first_name}`}
                    >
                      <ProfileImage member={member} size="small" className="w-6 h-6" />
                      {member.first_name} {member.last_name}
                      <span className="writer-tagged-remove"><X style={{ width: '10px', height: '10px' }} /></span>
                    </span>
                  ))}
                </div>
              )}

              {/* Search + Member Checklist */}
              <div style={{ marginTop: taggedMembers.length > 0 ? '12px' : '0' }}>
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <Search style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '14px',
                    height: '14px',
                    color: 'var(--vine-sage, #86A789)',
                  }} />
                  <input
                    type="text"
                    value={peopleSearchQuery}
                    onChange={(e) => setPeopleSearchQuery(e.target.value)}
                    placeholder="Search family members..."
                    className="writer-input"
                    style={{ paddingLeft: '34px', fontSize: '0.82rem' }}
                  />
                </div>

                <div className="writer-members-panel">
                  {members.length === 0 ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--vine-sage)', padding: '12px', margin: 0 }}>
                      No family members found
                    </p>
                  ) : filteredMembers.length === 0 ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--vine-sage)', padding: '12px', margin: 0 }}>
                      No matching members
                    </p>
                  ) : (
                    filteredMembers.map((member) => (
                      <label key={member.id} className="writer-member-row">
                        <input
                          type="checkbox"
                          checked={formData.member_ids.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                          className="writer-member-checkbox"
                        />
                        <ProfileImage member={member} size="small" className="w-6 h-6" style={{ borderRadius: '50%' }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--vine-dark, #2D4F1E)' }}>
                          {member.first_name} {member.last_name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '8px' }}>
              <button type="submit" disabled={saving} className="writer-save-btn">
                {saving ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '16px', height: '16px' }} />
                    {isEditing ? 'Update Story' : 'Publish to Anthology'}
                  </>
                )}
              </button>
              <Link
                to={isEditing ? `/stories/${id}` : '/stories'}
                className="writer-cancel-btn"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* ─── RIGHT: Story Spark Sidebar ─── */}
          <aside className="writers-desk-sidebar" style={{ width: '280px', flexShrink: 0 }}>

            {/* Story Spark Box */}
            <div className="story-spark">
              <div className="story-spark-title">Story Spark</div>
              <p className="story-spark-prompt">"{STORY_PROMPTS[sparkIndex]}"</p>
              <button
                type="button"
                onClick={shuffleSpark}
                className="story-spark-refresh"
              >
                <RefreshCw style={{ width: '11px', height: '11px', display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                New prompt
              </button>
            </div>

            {/* Writing Tips */}
            <div className="story-spark" style={{ marginTop: '16px' }}>
              <div className="story-spark-title">Writing Tips</div>
              <ul style={{
                fontFamily: 'var(--font-body, "Inter", sans-serif)',
                fontSize: '0.78rem',
                color: 'var(--vine-dark, #2D4F1E)',
                lineHeight: 1.7,
                paddingLeft: '16px',
                margin: 0,
                opacity: 0.8,
              }}>
                <li>Start with a vivid detail or moment</li>
                <li>Use real names and places</li>
                <li>Include dialogue when you can remember it</li>
                <li>Don't worry about perfect grammar</li>
                <li>Tag the people mentioned so they can find it</li>
              </ul>
            </div>

            {/* Word Count */}
            {formData.content && (
              <div style={{
                marginTop: '16px',
                padding: '14px 18px',
                background: 'rgba(134, 167, 137, 0.06)',
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'var(--font-header, "Playfair Display", serif)',
                  fontSize: '1.6rem',
                  fontWeight: 600,
                  color: 'var(--vine-green, #2E5A2E)',
                }}>
                  {formData.content.trim().split(/\s+/).filter(Boolean).length}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body, "Inter", sans-serif)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--vine-sage, #86A789)',
                  marginTop: '2px',
                }}>
                  Words Written
                </div>
              </div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
};

export default AddEditStory;
