import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, User, Edit, Trash2 } from 'lucide-react';

const StoriesPage = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPerson, setFilterPerson] = useState('all');

  useEffect(() => {
    fetchStories();
    fetchMembers();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories`);

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const data = await response.json();
      setStories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      setStories(stories.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story: ' + error.message);
    }
  };

  const truncateContent = (content, maxLength = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const filteredStories = filterPerson === 'all'
    ? stories
    : stories.filter(story =>
        story.members && story.members.some(m => m.id === parseInt(filterPerson))
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading stories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf7ee] dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2 mb-1">
                <BookOpen className="w-6 h-6" />
                Family Stories
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Memories, anecdotes, and stories that bring your family history to life
              </p>
            </div>

            <button
              onClick={() => navigate('/stories/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Story
            </button>
          </div>

          {/* Filter */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Filter by person:
            </label>
            <select
              value={filterPerson}
              onChange={(e) => setFilterPerson(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Stories ({stories.length})</option>
              {members.map((member) => {
                const count = stories.filter(s =>
                  s.members && s.members.some(m => m.id === member.id)
                ).length;
                if (count > 0) {
                  return (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({count})
                    </option>
                  );
                }
                return null;
              })}
            </select>
          </div>
        </div>

        {/* Stories List */}
        {filteredStories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {filterPerson === 'all' ? 'No stories yet' : 'No stories for this person'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filterPerson === 'all'
                ? 'Start building your family history by adding your first story'
                : 'This person is not mentioned in any stories yet'}
            </p>
            {filterPerson === 'all' && (
              <button
                onClick={() => navigate('/stories/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add First Story
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all border border-white/50 overflow-hidden group h-[425px]"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {story.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      {story.author_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {story.author_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-4 text-sm">
                    {truncateContent(story.content)}
                  </div>

                  {/* Related Members Tags */}
                  {story.members && story.members.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {story.members.map((member) => (
                          <Link
                            key={member.id}
                            to={`/members/${member.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                          >
                            {member.first_name} {member.last_name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate(`/stories/${story.id}`)}
                      className="flex-1 text-center bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all text-sm"
                    >
                      Read Story
                    </button>
                    <button
                      onClick={() => navigate(`/stories/${story.id}/edit`)}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      title="Edit story"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(story.id, story.title)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesPage;
