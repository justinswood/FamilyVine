import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, BookOpen, Search } from 'lucide-react';

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
    photo_ids: []
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

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchStory = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('token');
      const headers = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories/${id}`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error('Story not found');
      }

      const data = await response.json();

      setFormData({
        title: data.title || '',
        content: data.content || '',
        author_name: data.author_name || '',
        story_date: data.story_date ? data.story_date.split('T')[0] : '',
        member_ids: data.members ? data.members.map(m => m.id) : [],
        photo_ids: data.photos ? data.photos.map(p => p.id) : []
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching story:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuthorNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      author_name: value
    }));

    // Filter members based on input
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
        ? prev.member_ids.filter(id => id !== memberId)
        : [...prev.member_ids, memberId]
    }));
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
        ? `${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories/${id}`
        : `${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories`;

      // Get authentication token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: headers,
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save story');
      }

      const savedStory = await response.json();
      navigate(`/stories/${savedStory.id}`);
    } catch (error) {
      console.error('Error saving story:', error);
      setError(error.message);
      setSaving(false);
    }
  };

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    if (!peopleSearchQuery.trim()) return true;
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(peopleSearchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf7ee] dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Link
            to={isEditing ? `/stories/${id}` : '/stories'}
            className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-orange-600 dark:text-orange-400" />
            {isEditing ? 'Edit Story' : 'Add New Story'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Give your story a title"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Story Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
              placeholder="Write your family story here..."
            />
          </div>

          {/* Author Name with Autocomplete */}
          <div className="mb-6 relative" ref={authorInputRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author Name
            </label>
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Who wrote or told this story?"
              autoComplete="off"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Start typing to search family members
            </p>

            {/* Autocomplete Dropdown */}
            {showAuthorSuggestions && authorSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {authorSuggestions.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => selectAuthorSuggestion(member)}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-900 dark:text-white transition-colors"
                  >
                    {member.first_name} {member.last_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Story Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date of Story
            </label>
            <input
              type="date"
              name="story_date"
              value={formData.story_date}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              When did this story or memory take place?
            </p>
          </div>

          {/* Related Members with Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              People in this story
            </label>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={peopleSearchQuery}
                onChange={(e) => setPeopleSearchQuery(e.target.value)}
                placeholder="Search family members..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700 max-h-60 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No family members found</p>
              ) : filteredMembers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No matching members found</p>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.member_ids.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-gray-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {formData.member_ids.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.member_ids.length} {formData.member_ids.length === 1 ? 'person' : 'people'} selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Update Story' : 'Save Story'}
                </>
              )}
            </button>

            <Link
              to={isEditing ? `/stories/${id}` : '/stories'}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditStory;
