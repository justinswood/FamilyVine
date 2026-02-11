import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ── Leaf SVG Icon (matches Chronicle leaf motif) ── */
const LeafIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-3.5 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

const RecipesPage = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch recipes
  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/recipes`);
      setRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={fetchRecipes}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
            style={{
              fontFamily: 'var(--font-body)',
              color: '#fffdf9',
              background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
              boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
            }}
          >
            Retry
          </button>
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
            <pattern id="recipe-archival-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" className="text-vine-300 dark:text-gray-700" fill="currentColor" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#recipe-archival-pattern)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">

        {/* Recipe Header — Gilded Vellum */}
        <div className="recipe-header mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h1 className="recipe-header-title">Heirloom Kitchen</h1>
              <p className="mt-0.5 tracking-widest uppercase" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)', fontSize: '0.65rem' }}>
                Preserving our culinary traditions
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#fffdf9',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(45, 79, 30, 0.35)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(45, 79, 30, 0.25)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Recipe
            </button>
          </div>
        </div>


        {/* Recipe masonry grid */}
        {recipes.length === 0 ? (
          <div className="recipe-empty-state max-w-md mx-auto">
            <div className="flex justify-center mb-4">
              <LeafIcon className="w-12 h-12 opacity-30" />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
              No Recipes Yet
            </h3>
            <p className="text-sm mb-5" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-sage)' }}>
              Start your family's cookbook by adding the first recipe.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
              style={{
                fontFamily: 'var(--font-body)',
                color: '#fffdf9',
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
            >
              Add First Recipe
            </button>
          </div>
        ) : (
          <div className="recipe-masonry">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* Create Recipe Modal */}
      {showCreateModal && (
        <CreateRecipeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(recipeId) => {
            setShowCreateModal(false);
            navigate(`/recipes/${recipeId}`, { state: { editMode: true } });
          }}
        />
      )}
    </div>
  );
};

// Recipe Card Component — Heirloom Archival Design
const RecipeCard = ({ recipe }) => {
  const API_URL = process.env.REACT_APP_API;

  const photoUrl = recipe.photo_url
    ? recipe.photo_url.startsWith('http')
      ? recipe.photo_url
      : `${API_URL}/${recipe.photo_url}`
    : null;

  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card block">
      {/* Photo with heirloom filter */}
      <div className="relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={recipe.title}
            className="recipe-card-img"
            loading="lazy"
          />
        ) : (
          <div className="recipe-card-no-photo">
            <LeafIcon className="w-8 h-8 mb-1 opacity-40" />
            <span className="text-xs font-medium opacity-50" style={{ fontFamily: 'var(--font-body)' }}>
              No photo
            </span>
          </div>
        )}

        {/* Favorite badge */}
        {recipe.is_family_favorite && (
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.title}</h3>

        {recipe.description && (
          <p className="recipe-card-description">{recipe.description}</p>
        )}

        {/* Category */}
        {recipe.category && (
          <span className="recipe-card-category">{recipe.category}</span>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="recipe-card-tag">#{tag}</span>
            ))}
            {recipe.tags.length > 3 && (
              <span className="recipe-card-tag">+{recipe.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="recipe-card-meta">
          {recipe.total_time && (
            <div className="recipe-card-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {recipe.total_time} min
            </div>
          )}

          {recipe.comment_count > 0 && (
            <div className="recipe-card-meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {recipe.comment_count}
            </div>
          )}
        </div>

        {/* Contributor ribbon */}
        {recipe.contributor_name && (
          <div className="recipe-card-contributor">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="recipe-card-contributor-name">{recipe.contributor_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

// Create Recipe Modal Component — Heirloom Style
const CreateRecipeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Recipe title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/recipes`,
        {
          ...formData,
          ingredients: 'Add ingredients...',
          instructions: 'Add instructions...',
        }
      );

      onSuccess(response.data.id);

    } catch (err) {
      console.error('Error creating recipe:', err);
      setError('Failed to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="recipe-create-modal">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-header)', color: 'var(--vine-dark)' }}>
          New Recipe
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-dark)' }}>
              Recipe Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
              placeholder="e.g., Grandma's Apple Pie"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-dark)' }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border border-vine-200 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white/90 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-vine-500 focus:border-transparent transition-all"
            >
              <option value="">Select category...</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Main Course">Main Course</option>
              <option value="Side Dish">Side Dish</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Soup">Soup</option>
              <option value="Salad">Salad</option>
            </select>
            <p className="text-xs mt-1" style={{ color: 'var(--vine-sage)' }}>
              You can edit all details after creating the recipe.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--vine-green), var(--vine-dark))',
                boxShadow: '0 2px 8px rgba(45, 79, 30, 0.25)',
              }}
            >
              {loading ? 'Creating...' : 'Create & Edit'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-vine-200 dark:border-gray-600 hover:bg-vine-50 dark:hover:bg-gray-700 transition-all"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--vine-dark)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipesPage;
