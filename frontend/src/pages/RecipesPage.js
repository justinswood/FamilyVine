import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RecipesPage = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Metadata
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch recipes
  useEffect(() => {
    fetchRecipes();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API}/api/recipes`);
      setRecipes(response.data);
      setFilteredRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/recipes/meta/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/recipes/meta/tags`);
      setTags(response.data);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.ingredients?.toLowerCase().includes(query) ||
        recipe.contributor_name?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(recipe =>
        recipe.tags && recipe.tags.includes(selectedTag)
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(recipe => recipe.is_family_favorite);
    }

    setFilteredRecipes(filtered);
  }, [searchQuery, selectedCategory, selectedTag, showFavoritesOnly, recipes]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setShowFavoritesOnly(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipes...</p>
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
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
      <div className="container mx-auto px-4 py-2">
        {/* COMPACT HEADER - matches Members page */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1 mb-2 border border-white/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <div className="p-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Family Recipes</h1>
                <p className="text-xs text-gray-600">Preserving our culinary traditions</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition shadow-md text-sm"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Recipe
            </button>
          </div>
        </div>

        {/* Filters - Compact */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-2 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <svg className="h-3 w-3 text-gray-400 absolute left-2 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Tag filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag.tag_name} value={tag.tag_name}>
                  {tag.tag_name} ({tag.count})
                </option>
              ))}
            </select>

            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center justify-center gap-1 px-2 py-1 text-sm rounded-lg border transition ${
                showFavoritesOnly
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-500'
              }`}
            >
              <svg className="h-3 w-3" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorites
            </button>
          </div>

          {/* Active filters summary */}
          {(searchQuery || selectedCategory || selectedTag || showFavoritesOnly) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  Category: {selectedCategory}
                </span>
              )}
              {selectedTag && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Tag: {selectedTag}
                </span>
              )}
              {showFavoritesOnly && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                  Favorites Only
                </span>
              )}
              <button
                onClick={clearFilters}
                className="ml-2 text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredRecipes.length} of {recipes.length} recipes
          </p>
        </div>

        {/* Recipe grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-4">No recipes found</p>
            <button
              onClick={clearFilters}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
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
            navigate(`/recipes/${recipeId}`);
          }}
        />
      )}
    </div>
  );
};

// Recipe Card Component
const RecipeCard = ({ recipe }) => {
  const API_URL = process.env.REACT_APP_API;

  const photoUrl = recipe.photo_url
    ? recipe.photo_url.startsWith('http')
      ? recipe.photo_url
      : `${API_URL}/${recipe.photo_url}`
    : null;

  return (
    <Link to={`/recipes/${recipe.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        {/* Photo */}
        <div className="h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-red-100">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title and favorite */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition line-clamp-2">
              {recipe.title}
            </h3>
            {recipe.is_family_favorite && (
              <svg className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {recipe.description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            {/* Contributor */}
            {recipe.contributor_name && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{recipe.contributor_name}</span>
              </div>
            )}

            {/* Times */}
            {recipe.total_time && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{recipe.total_time} min total</span>
              </div>
            )}

            {/* Category */}
            {recipe.category && (
              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                {recipe.category}
              </span>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {recipe.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{recipe.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Comment count */}
          {recipe.comment_count > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
              {recipe.comment_count} {recipe.comment_count === 1 ? 'comment' : 'comments'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

// Create Recipe Modal Component
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Recipe</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Grandma's Apple Pie"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create & Edit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipesPage;
