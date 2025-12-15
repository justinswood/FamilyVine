import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, ChefHat, Users, Heart, Edit, Trash2, ArrowLeft, Camera } from 'lucide-react';
import IngredientsEditor from '../components/IngredientsEditor';
import InstructionStepsEditor from '../components/InstructionStepsEditor';
import ProfileImage from '../components/ProfileImage';

const RecipeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Form state for editing
  const [formData, setFormData] = useState({});

  // Photo upload
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Comments
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Members for contributor selection
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    fetchRecipe();
    fetchMembers();
  }, [id]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setMembers(response.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/recipes/${id}`);
      setRecipe(response.data);

      // Convert tags array to comma-separated string for the edit form
      const formDataWithStringTags = {
        ...response.data,
        tags: Array.isArray(response.data.tags)
          ? response.data.tags.join(', ')
          : response.data.tags || ''
      };
      setFormData(formDataWithStringTags);

      // Initialize memberSearch with contributor name if present
      if (response.data.contributor_name) {
        setMemberSearch(response.data.contributor_name);
      }
    } catch (err) {
      console.error('Error fetching recipe:', err);
      setError('Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/recipes/${id}`, formData);
      await fetchRecipe();
      setIsEditing(false);
      alert('Recipe updated successfully!');
    } catch (err) {
      console.error('Error updating recipe:', err);
      alert('Failed to update recipe');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;

    try {
      setUploadingPhoto(true);
      const photoFormData = new FormData();
      photoFormData.append('photo', selectedPhoto);

      await axios.post(
        `${process.env.REACT_APP_API}/api/recipes/${id}/photo`,
        photoFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      await fetchRecipe();
      setSelectedPhoto(null);
      setPhotoPreview(null);
      alert('Photo uploaded successfully!');
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setAddingComment(true);
      await axios.post(`${process.env.REACT_APP_API}/api/recipes/${id}/comments`, {
        comment_text: newComment
      });
      await fetchRecipe();
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/recipes/${id}/comments/${commentId}`);
      await fetchRecipe();
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  const toggleFavorite = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API}/api/recipes/${id}`, {
        ...recipe,
        is_family_favorite: !recipe.is_family_favorite
      });
      await fetchRecipe();
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API}/api/recipes/${id}`);
      navigate('/recipes');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert('Failed to delete recipe');
    }
  };

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">{error || 'Recipe not found'}</p>
          <Link to="/recipes" className="text-orange-500 hover:text-orange-600 underline">
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  const API_URL = process.env.REACT_APP_API;
  const photoUrl = recipe.photo_url
    ? recipe.photo_url.startsWith('http')
      ? recipe.photo_url
      : `${API_URL}/${recipe.photo_url}`
    : null;

  const displayPhotoUrl = photoPreview || photoUrl;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back Button - Fixed at top */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Recipes</span>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                recipe.is_family_favorite
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={recipe.is_family_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className="w-5 h-5" fill={recipe.is_family_favorite ? "currentColor" : "none"} />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-lg transition-colors ${
                isEditing
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Edit recipe"
            >
              <Edit className="w-5 h-5" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete recipe"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section - Split Layout */}
      {!isEditing && (
        <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Side - Title, Description, Total Cook Time */}
              <div className="relative flex flex-col justify-center p-3 md:p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900">
                {/* Contributor Profile Picture - Upper Right Corner */}
                {recipe.contributed_by && (() => {
                  const contributor = members.find(m => m.id === recipe.contributed_by);
                  if (contributor) {
                    return (
                      <div className="absolute top-3 right-3 flex flex-col items-center">
                        <Link to={`/members/${contributor.id}`}>
                          <ProfileImage member={contributor} size="small" className="w-16 h-16" />
                        </Link>
                        <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                          {contributor.first_name}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 pr-20">
                  {recipe.title}
                </h1>

                {recipe.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed pr-20">
                    {recipe.description}
                  </p>
                )}

                {/* Total Cook Time & Tags */}
                <div className="space-y-2">
                  {recipe.total_time && (
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Time</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{recipe.total_time} min</div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="relative h-32 md:h-48 bg-gradient-to-br from-orange-500 to-red-500">
                {displayPhotoUrl ? (
                  <img
                    src={displayPhotoUrl}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Edit Mode Header */}
        {isEditing && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-4">EDIT MODE</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief description of the recipe..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              {/* Member Contributor Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipe Contributed By
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search for a family member..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />

                  {/* Dropdown with filtered members */}
                  {memberSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {members
                        .filter(m => {
                          const searchLower = memberSearch.toLowerCase();
                          const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
                          return fullName.includes(searchLower);
                        })
                        .map(member => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, contributed_by: member.id });
                              setMemberSearch(''); // Clear search to hide dropdown
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                          >
                            <ProfileImage member={member} size="small" className="w-8 h-8" />
                            <span className="text-gray-900 dark:text-white">
                              {member.first_name} {member.last_name}
                            </span>
                          </button>
                        ))}
                      {members.filter(m => {
                        const searchLower = memberSearch.toLowerCase();
                        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
                        return fullName.includes(searchLower);
                      }).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                          No members found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Show selected contributor */}
                {formData.contributed_by && !memberSearch && (
                  <div className="mt-2">
                    {(() => {
                      const contributor = members.find(m => m.id === formData.contributed_by);
                      if (contributor) {
                        return (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <ProfileImage member={contributor} size="small" className="w-8 h-8" />
                            <span>Selected: {contributor.first_name} {contributor.last_name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, contributed_by: null });
                                setMemberSearch('');
                              }}
                              className="ml-2 text-red-600 dark:text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Photo Upload in Edit Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recipe Photo</label>
                {(photoPreview || photoUrl) && (
                  <div className="relative mb-4">
                    <img
                      src={photoPreview || photoUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-50 dark:file:bg-orange-900/20 file:text-orange-700 dark:file:text-orange-400
                    hover:file:bg-orange-100 dark:hover:file:bg-orange-900/30 file:cursor-pointer"
                />
                {photoPreview && (
                  <button
                    onClick={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                  </button>
                )}
              </div>

              {/* Time and Servings Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={formData.prep_time || ''}
                    onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                    placeholder="15"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cook Time (min)</label>
                  <input
                    type="number"
                    value={formData.cook_time || ''}
                    onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                    placeholder="45"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Time (min)</label>
                  <input
                    type="number"
                    value={formData.total_time || ''}
                    onChange={(e) => setFormData({ ...formData, total_time: e.target.value })}
                    placeholder="60"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Servings</label>
                  <input
                    type="text"
                    value={formData.servings || ''}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="6-8 slices"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Dessert, Main Course, Appetizer"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags || ''}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., holiday, family-favorite, quick"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Badges - Compact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Prep Time */}
            {recipe.prep_time && (
              <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-0.5">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">Prep Time</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{recipe.prep_time}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">minutes</div>
              </div>
            )}

            {/* Cook Time */}
            {recipe.cook_time && (
              <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 mb-0.5">
                  <ChefHat className="w-3 h-3" />
                  <span className="text-xs font-medium">Cook Time</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{recipe.cook_time}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">minutes</div>
              </div>
            )}

            {/* Total Time */}
            {recipe.total_time && (
              <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-0.5">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">Total Time</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{recipe.total_time}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">minutes</div>
              </div>
            )}

            {/* Servings */}
            {recipe.servings && (
              <div className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-0.5">
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-medium">Servings</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{recipe.servings}</div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">people</div>
              </div>
            )}
          </div>

          {/* Category Only */}
          {recipe.category && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                {recipe.category}
              </span>
            </div>
          )}

          {/* Contributor */}
          {recipe.contributor_name && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Recipe contributed by{' '}
                <Link
                  to={`/members/${recipe.contributor_id}`}
                  className="text-orange-600 dark:text-orange-400 hover:underline font-medium"
                >
                  {recipe.contributor_name}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Two Column Layout - Ingredients & Instructions */}
        <div className="grid md:grid-cols-5 gap-6 mb-6">
          {/* Ingredients - Left Column (2/5) */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 sticky top-32">
              {isEditing ? (
                <IngredientsEditor
                  value={formData.ingredients || ''}
                  onChange={(value) => setFormData({ ...formData, ingredients: value })}
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ingredients</h2>
                  <div className="space-y-3">
                    {recipe.ingredients.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checkedIngredients[idx] || false}
                          onChange={() => toggleIngredient(idx)}
                          className="mt-1 w-5 h-5 text-orange-500 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className={`flex-1 text-gray-700 dark:text-gray-300 leading-relaxed transition-all ${
                          checkedIngredients[idx] ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}>
                          {line}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions - Right Column (3/5) */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <InstructionStepsEditor
                  value={formData.instructions || ''}
                  onChange={(value) => setFormData({ ...formData, instructions: value })}
                />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Instructions</h2>
                  <div className="space-y-6">
                    {recipe.instructions.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons (Edit Mode) */}
        {isEditing && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(recipe);
                  setPhotoPreview(null);
                  setSelectedPhoto(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 font-medium shadow-sm transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Family Notes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Family Notes</h2>

          {/* Add comment */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a family note or tip about this recipe..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows="3"
            />
            <button
              onClick={handleAddComment}
              disabled={addingComment || !newComment.trim()}
              className="mt-3 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium transition-colors"
            >
              {addingComment ? 'Adding...' : 'Add Note'}
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {recipe.comments && recipe.comments.length > 0 ? (
              recipe.comments
                .filter(comment => !comment.is_deleted)
                .map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{comment.comment_text}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {comment.member_name && (
                            <span className="font-medium">{comment.member_name}</span>
                          )}
                          <span>
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="ml-4 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No family notes yet. Be the first to add one!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeView;
