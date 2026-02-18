import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, Users, Heart, Edit, Trash2, ArrowLeft, Camera, Eye, EyeOff } from 'lucide-react';
import IngredientsEditor from '../components/IngredientsEditor';
import InstructionStepsEditor from '../components/InstructionStepsEditor';
import ProfileImage from '../components/ProfileImage';

/* ── Leaf SVG Icon ── */
const LeafIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

/* ── Scale ingredient quantities ── */
const scaleIngredientLine = (line, multiplier) => {
  if (multiplier === 1) return line;
  // Match fractions like 1/2, mixed numbers like 1 1/2, and decimals like 2.5
  return line.replace(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)/g, (match) => {
    let value;
    if (match.includes(' ') && match.includes('/')) {
      // Mixed number: "1 1/2"
      const parts = match.split(' ');
      const whole = parseFloat(parts[0]);
      const [num, den] = parts[1].split('/').map(Number);
      value = whole + num / den;
    } else if (match.includes('/')) {
      // Fraction: "1/2"
      const [num, den] = match.split('/').map(Number);
      value = num / den;
    } else {
      value = parseFloat(match);
    }
    const scaled = value * multiplier;
    // Format nicely
    if (Number.isInteger(scaled)) return String(scaled);
    if (scaled % 1 === 0.5) return `${Math.floor(scaled)} 1/2`;
    if (scaled % 1 === 0.25) return `${Math.floor(scaled)} 1/4`;
    if (scaled % 1 === 0.75) return `${Math.floor(scaled)} 3/4`;
    if (scaled % 1 === 0.333) return `${Math.floor(scaled)} 1/3`;
    if (scaled % 1 === 0.667) return `${Math.floor(scaled)} 2/3`;
    return scaled.toFixed(1).replace(/\.0$/, '');
  });
};

const RecipeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Check if we should start in edit mode (e.g., after creating a new recipe)
  const [isEditing, setIsEditing] = useState(location.state?.editMode || false);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Serving multiplier
  const [servingMultiplier, setServingMultiplier] = useState(1);

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

  // Save animation
  const [isSaving, setIsSaving] = useState(false);

  // Secret ingredients reveal
  const [secretsRevealed, setSecretsRevealed] = useState(false);

  useEffect(() => {
    fetchRecipe();
    fetchMembers();
  }, [id]);

  // Enter edit mode if navigated from recipe creation
  useEffect(() => {
    if (location.state?.editMode) {
      setIsEditing(true);
      // Clear the state so refreshing doesn't keep triggering edit mode
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
      setIsSaving(true);

      // Upload photo first if one is selected
      if (selectedPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('photo', selectedPhoto);
        await axios.post(
          `${process.env.REACT_APP_API}/api/recipes/${id}/photo`,
          photoFormData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      // Save recipe data
      await axios.put(`${process.env.REACT_APP_API}/api/recipes/${id}`, formData);

      // Brief pause for animation
      await new Promise(resolve => setTimeout(resolve, 800));
      await fetchRecipe();

      // Clear photo states
      setSelectedPhoto(null);
      setPhotoPreview(null);

      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error updating recipe:', err);
      alert('Failed to update recipe');
    } finally {
      setIsSaving(false);
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
      // UI updates automatically via fetchRecipe
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

  // Scaled ingredients
  const scaledIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return recipe.ingredients
      .split('\n')
      .filter(line => line.trim())
      .map(line => scaleIngredientLine(line, servingMultiplier));
  }, [recipe?.ingredients, servingMultiplier]);

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

  if (error || !recipe) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-xl mb-4">{error || 'Recipe not found'}</p>
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 text-sm"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Heirloom Kitchen
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

  // Find contributor member object
  const contributorMember = recipe.contributed_by
    ? members.find(m => m.id === recipe.contributed_by)
    : null;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Toolbar — Archival */}
      <div className="recipe-toolbar sticky top-16 z-40">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between max-w-6xl">
          <Link
            to="/recipes"
            className="inline-flex items-center gap-1.5 transition-colors"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Heirloom Kitchen</span>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              className={`recipe-toolbar-btn ${recipe.is_family_favorite ? 'recipe-toolbar-btn-active' : ''}`}
              title={recipe.is_family_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className="w-4 h-4" fill={recipe.is_family_favorite ? "#dc2626" : "none"} stroke={recipe.is_family_favorite ? "#dc2626" : "currentColor"} />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`recipe-toolbar-btn ${isEditing ? 'recipe-toolbar-btn-active' : ''}`}
              title="Edit recipe"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="recipe-toolbar-btn recipe-toolbar-btn-danger"
              title="Delete recipe"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section — Gilded Vellum */}
      {!isEditing && (
        <div className="recipe-hero w-full">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-[65%_35%] gap-0">
              {/* Left Side - Title & Description */}
              <div className="relative flex flex-col justify-center p-3 md:p-5">
                <h1 className="recipe-hero-title mb-1">
                  {recipe.title}
                </h1>

                {recipe.description && (
                  <p className="recipe-hero-description mb-2">
                    {recipe.description}
                  </p>
                )}

                {/* Quick Info */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.prep_time && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md recipe-meta-badge w-fit">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}>
                          <Clock className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div>
                          <div className="recipe-meta-badge-label" style={{ justifyContent: 'flex-start', marginBottom: 0, fontSize: '0.55rem' }}>Prep</div>
                          <div className="recipe-meta-badge-value" style={{ fontSize: '0.7rem' }}>{recipe.prep_time} min</div>
                        </div>
                      </div>
                    )}
                    {recipe.cook_time && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md recipe-meta-badge w-fit">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}>
                          <ChefHat className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div>
                          <div className="recipe-meta-badge-label" style={{ justifyContent: 'flex-start', marginBottom: 0, fontSize: '0.55rem' }}>Cook</div>
                          <div className="recipe-meta-badge-value" style={{ fontSize: '0.7rem' }}>{recipe.cook_time} min</div>
                        </div>
                      </div>
                    )}
                    {recipe.total_time && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md recipe-meta-badge w-fit">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}>
                          <Clock className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div>
                          <div className="recipe-meta-badge-label" style={{ justifyContent: 'flex-start', marginBottom: 0, fontSize: '0.55rem' }}>Total</div>
                          <div className="recipe-meta-badge-value" style={{ fontSize: '0.7rem' }}>{recipe.total_time} min</div>
                        </div>
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md recipe-meta-badge w-fit">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}>
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div>
                          <div className="recipe-meta-badge-label" style={{ justifyContent: 'flex-start', marginBottom: 0, fontSize: '0.55rem' }}>Servings</div>
                          <div className="recipe-meta-badge-value" style={{ fontSize: '0.7rem' }}>{recipe.servings}</div>
                        </div>
                      </div>
                    )}
                    {/* From the Kitchen of — inline badge */}
                    {recipe.contributor_name && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md recipe-meta-badge" style={{ minWidth: '10rem' }}>
                        {contributorMember && (
                          <Link to={`/members/${contributorMember.id}`}>
                            <ProfileImage member={contributorMember} size="small" className="w-9 h-9" style={{ border: '2px solid rgba(212,175,55,0.5)', borderRadius: '50%' }} />
                          </Link>
                        )}
                        <div>
                          <div className="recipe-meta-badge-label" style={{ justifyContent: 'flex-start', marginBottom: 0, fontSize: '0.55rem' }}>From the Kitchen of</div>
                          <Link
                            to={`/members/${recipe.contributor_id || recipe.contributed_by}`}
                            style={{ fontSize: '0.7rem', fontFamily: 'var(--font-body)', color: 'var(--vine-dark)', fontWeight: 600 }}
                          >
                            {recipe.contributor_name}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category + Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {recipe.category && (
                      <span className="recipe-card-category">{recipe.category}</span>
                    )}
                    {recipe.tags && recipe.tags.length > 0 && (
                      recipe.tags.map(tag => (
                        <span key={tag} className="recipe-card-tag">
                          #{tag}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="relative overflow-hidden min-h-[200px]" style={{ background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))' }}>
                {displayPhotoUrl ? (
                  <img src={displayPhotoUrl} alt={recipe.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
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
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Edit Mode Header */}
        {isEditing && (
          <div className="recipe-panel mb-6">
            <h2 className="recipe-edit-label" style={{ fontSize: '0.52rem', marginBottom: '11px' }}>Edit Mode</h2>

            <div className="space-y-3">
              <div>
                <label className="recipe-edit-label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="recipe-edit-input"
                />
              </div>

              <div>
                <label className="recipe-edit-label">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A brief description of the recipe..."
                  className="recipe-edit-textarea"
                  rows="3"
                />
              </div>

              {/* Member Contributor Dropdown */}
              <div>
                <label className="recipe-edit-label">
                  Recipe Contributed By
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search for a family member..."
                    className="recipe-edit-input"
                  />

                  {memberSearch && (
                    <div className="absolute z-10 w-full mt-1 rounded-md shadow-lg max-h-48 overflow-y-auto" style={{ backgroundColor: 'var(--alabaster-parchment)', border: '1px solid rgba(212,175,55,0.25)' }}>
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
                              setMemberSearch('');
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-vine-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                          >
                            <ProfileImage member={member} size="small" className="w-6 h-6" />
                            <span className="text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-body)', fontSize: '0.6rem' }}>
                              {member.first_name} {member.last_name}
                            </span>
                          </button>
                        ))}
                      {members.filter(m => {
                        const searchLower = memberSearch.toLowerCase();
                        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
                        return fullName.includes(searchLower);
                      }).length === 0 && (
                        <div className="px-4 py-2" style={{ color: 'var(--vine-sage)' }}>
                          No members found
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {formData.contributed_by && !memberSearch && (
                  <div className="mt-3">
                    {(() => {
                      const contributor = members.find(m => m.id === formData.contributed_by);
                      if (contributor) {
                        return (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'var(--alabaster-parchment)', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <div style={{ border: '2px solid rgba(212,175,55,0.5)', borderRadius: '50%' }}>
                              <ProfileImage member={contributor} size="small" className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.42rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(163,130,40,0.8)', fontWeight: 600 }}>
                                FROM THE KITCHEN OF
                              </div>
                              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.7rem', fontWeight: 700, color: 'var(--vine-dark)' }}>
                                {contributor.first_name} {contributor.last_name}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, contributed_by: null });
                                setMemberSearch('');
                              }}
                              className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              style={{ color: 'var(--vine-sage)' }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="recipe-edit-label">Recipe Photo</label>
                {(photoPreview || photoUrl) && (
                  <div className="relative mb-4">
                    <img
                      src={photoPreview || photoUrl}
                      alt="Preview"
                      className="w-full max-h-44 object-cover rounded-md"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-xs text-gray-500 dark:text-gray-400
                    file:mr-3 file:py-1.5 file:px-3
                    file:rounded-md file:border-0
                    file:text-xs file:font-semibold
                    file:bg-vine-50 dark:file:bg-vine-900/20 file:text-vine-700 dark:file:text-vine-400
                    hover:file:bg-vine-100 dark:hover:file:bg-vine-900/30 file:cursor-pointer"
                />
                {photoPreview && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--vine-sage)', fontFamily: 'var(--font-body)' }}>
                    Photo will be saved when you click "Save Changes"
                  </p>
                )}
              </div>

              {/* Time and Servings Badges */}
              <div className="flex flex-wrap justify-center gap-4 py-1.5">
                <div className="recipe-time-badge-wrapper">
                  <input
                    type="number"
                    value={formData.prep_time || ''}
                    onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                    placeholder="15"
                    className="recipe-time-badge-input"
                  />
                  <span className="recipe-time-badge-label">Prep</span>
                </div>
                <div className="recipe-time-badge-wrapper">
                  <input
                    type="number"
                    value={formData.cook_time || ''}
                    onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                    placeholder="45"
                    className="recipe-time-badge-input"
                  />
                  <span className="recipe-time-badge-label">Cook</span>
                </div>
                <div className="recipe-time-badge-wrapper">
                  <input
                    type="number"
                    value={formData.total_time || ''}
                    onChange={(e) => setFormData({ ...formData, total_time: e.target.value })}
                    placeholder="60"
                    className="recipe-time-badge-input"
                  />
                  <span className="recipe-time-badge-label">Total</span>
                </div>
                <div className="recipe-time-badge-wrapper">
                  <input
                    type="text"
                    value={formData.servings || ''}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="6-8"
                    className="recipe-time-badge-input"
                    style={{ width: '50px', height: '50px' }}
                  />
                  <span className="recipe-time-badge-label">Servings</span>
                </div>
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="recipe-edit-label">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Dessert, Main Course"
                    className="recipe-edit-input"
                  />
                </div>

                <div>
                  <label className="recipe-edit-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags || ''}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., holiday, family-favorite, quick"
                    className="recipe-edit-input"
                  />
                </div>
              </div>

              {/* Chef's Tips */}
              <div>
                <label className="recipe-edit-label">Chef's Tips</label>
                <textarea
                  value={formData.chef_notes || ''}
                  onChange={(e) => setFormData({ ...formData, chef_notes: e.target.value })}
                  placeholder="Any personal tips, secret techniques, or family wisdom for this recipe..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '11px',
                    fontFamily: 'var(--font-handwritten)',
                    fontSize: '0.74rem',
                    lineHeight: '1.8',
                    color: 'var(--vine-dark)',
                    background: `var(--alabaster-parchment) repeating-linear-gradient(transparent, transparent 19px, rgba(212,175,55,0.12) 19px, rgba(212,175,55,0.12) 20px)`,
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '6px',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.2)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout - Ingredients & Instructions */}
        <div className="grid md:grid-cols-5 gap-6 mb-6">
          {/* Ingredients - Left Column (2/5) */}
          <div className="md:col-span-2">
            <div className="recipe-panel sticky top-32">
              {isEditing ? (
                <IngredientsEditor
                  value={formData.ingredients || ''}
                  onChange={(value) => setFormData({ ...formData, ingredients: value })}
                />
              ) : (
                <>
                  <h2 className="recipe-panel-title">Ingredients</h2>

                  {/* Serving Multiplier Slider */}
                  <div className="serving-slider-container mb-5">
                    <span className="serving-slider-label">Scale:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={servingMultiplier}
                      onChange={(e) => setServingMultiplier(parseFloat(e.target.value))}
                      className="serving-slider"
                    />
                    <span className="serving-multiplier-display">{servingMultiplier}x</span>
                  </div>

                  {/* Secret Ingredients Reveal Button */}
                  {scaledIngredients.some(line => line.startsWith('[SECRET]')) && (
                    <button
                      onClick={() => setSecretsRevealed(!secretsRevealed)}
                      className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        fontFamily: 'var(--font-body)',
                        background: secretsRevealed ? 'rgba(212,175,55,0.15)' : 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))',
                        color: 'rgba(163, 130, 40, 0.9)',
                        border: '1px solid rgba(212,175,55,0.3)',
                      }}
                    >
                      {secretsRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {secretsRevealed ? 'Hide Secret Ingredients' : 'Reveal Secret Ingredients'}
                    </button>
                  )}

                  <div className="space-y-3">
                    {scaledIngredients.map((line, idx) => {
                      const isSecret = line.startsWith('[SECRET]');
                      const displayLine = isSecret ? line.replace('[SECRET]', '').trim() : line;
                      const showAsHidden = isSecret && !secretsRevealed;

                      return (
                        <label key={idx} className={`flex items-start gap-3 cursor-pointer group ${isSecret && secretsRevealed ? 'recipe-secret-glow' : ''}`} style={isSecret && secretsRevealed ? { paddingLeft: '8px', marginLeft: '-8px' } : {}}>
                          <input
                            type="checkbox"
                            checked={checkedIngredients[idx] || false}
                            onChange={() => toggleIngredient(idx)}
                            className="mt-1 w-4 h-4 text-vine-600 border-vine-200 rounded focus:ring-2 focus:ring-vine-500 cursor-pointer"
                          />
                          <span
                            className={`flex-1 leading-relaxed transition-all ${
                              checkedIngredients[idx] ? 'line-through opacity-40' : ''
                            }`}
                            style={{
                              fontFamily: showAsHidden ? 'var(--font-handwritten)' : 'var(--font-body)',
                              fontSize: '0.72rem',
                              color: showAsHidden ? 'rgba(212,175,55,0.7)' : (checkedIngredients[idx] ? 'var(--vine-sage)' : 'var(--vine-dark)'),
                              fontStyle: showAsHidden ? 'italic' : 'normal',
                            }}
                          >
                            {showAsHidden ? 'Secret ingredient...' : displayLine}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Instructions - Right Column (3/5) */}
          <div className="md:col-span-3">
            <div className="recipe-panel">
              {isEditing ? (
                <InstructionStepsEditor
                  value={formData.instructions || ''}
                  onChange={(value) => setFormData({ ...formData, instructions: value })}
                />
              ) : (
                <>
                  <h2 className="recipe-panel-title">Instructions</h2>
                  <div className="space-y-5">
                    {recipe.instructions.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="recipe-step-number">
                          {idx + 1}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--vine-dark)', lineHeight: '1.6' }}>
                            {line}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chef's Tips (View Mode) */}
        {!isEditing && recipe.chef_notes && (
          <div className="recipe-panel mb-6">
            <h2 className="recipe-panel-title">Chef's Tips</h2>
            <div
              style={{
                fontFamily: 'var(--font-handwritten)',
                fontSize: '0.74rem',
                lineHeight: '1.8',
                color: 'var(--vine-dark)',
                padding: '11px',
                background: `var(--alabaster-parchment) repeating-linear-gradient(transparent, transparent 19px, rgba(212,175,55,0.12) 19px, rgba(212,175,55,0.12) 20px)`,
                borderRadius: '6px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {recipe.chef_notes}
            </div>
          </div>
        )}

        {/* Save/Cancel Buttons (Edit Mode) */}
        {isEditing && (
          <div className="recipe-panel mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(recipe);
                  setPhotoPreview(null);
                  setSelectedPhoto(null);
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-md text-xs font-medium border transition-all disabled:opacity-50"
                style={{ fontFamily: 'var(--font-body)', borderColor: 'rgba(0,0,0,0.08)', color: 'var(--vine-dark)' }}
              >
                Cancel
              </button>
              <motion.button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-1 px-4 py-2 rounded-md text-white text-xs font-medium transition-all disabled:opacity-80 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                  boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence mode="wait">
                  {isSaving ? (
                    <motion.span
                      key="saving"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="inline-block text-base"
                    >
                      &#x269C;
                    </motion.span>
                  ) : (
                    <motion.span
                      key="text"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Save Changes
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        )}

        {/* Family Notes Section */}
        <div className="recipe-notes-panel">
          <h2 className="recipe-panel-title">Family Notes</h2>

          {/* Add comment */}
          <div className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a family note or tip about this recipe..."
              className="w-full p-4 border rounded-lg bg-white/90 dark:bg-gray-900 focus:ring-2 focus:ring-vine-500 focus:border-transparent resize-none"
              rows="3"
              style={{ fontFamily: 'var(--font-body)', borderColor: 'rgba(0,0,0,0.08)', color: 'var(--vine-dark)' }}
            />
            <button
              onClick={handleAddComment}
              disabled={addingComment || !newComment.trim()}
              className="mt-3 px-5 py-2 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
            >
              {addingComment ? 'Adding...' : 'Add Note'}
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {recipe.comments && recipe.comments.length > 0 ? (
              recipe.comments
                .filter(comment => !comment.is_deleted)
                .map((comment) => (
                  <div key={comment.id} className="recipe-note-item">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--vine-dark)', lineHeight: '1.5' }}>
                          {comment.comment_text}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--vine-sage)' }}>
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
                        className="ml-4 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center py-8" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>
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
