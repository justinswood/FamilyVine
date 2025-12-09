import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Users, Edit, Trash2, BookOpen } from 'lucide-react';

const StoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  const fetchStory = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories/${id}`);

      if (!response.ok) {
        throw new Error('Story not found');
      }

      const data = await response.json();
      setStory(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching story:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API || 'http://localhost:5050'}/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      navigate('/stories');
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Story not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The story you are looking for does not exist.'}
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Stories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Stories
          </Link>
        </div>

        {/* Story Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">

          {/* Story Header */}
          <div className="p-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex-1">
                {story.title}
              </h1>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-4">
                <Link
                  to={`/stories/${id}/edit`}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Edit Story"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Story"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {story.story_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(story.story_date)}</span>
                </div>
              )}

              {story.author_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By {story.author_name}</span>
                </div>
              )}

              {story.members && story.members.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{story.members.length} {story.members.length === 1 ? 'person' : 'people'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Story Body */}
          <div className="p-8">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {story.content}
              </p>
            </div>
          </div>

          {/* Related Members */}
          {story.members && story.members.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                People in this story
              </h2>
              <div className="flex flex-wrap gap-3">
                {story.members.map((member) => (
                  <Link
                    key={member.id}
                    to={`/members/${member.id}`}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    {member.first_name} {member.last_name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {story.photos && story.photos.length > 0 && (
            <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Photos ({story.photos.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {story.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={`${process.env.REACT_APP_API || 'http://localhost:5050'}${photo.file_path}`}
                      alt={photo.caption || 'Story photo'}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Delete Story?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{story.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryView;
