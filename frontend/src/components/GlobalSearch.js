import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, X } from 'lucide-react';
import axios from 'axios';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Helper function to format birth date without timezone
  const formatBirthDate = (dateString) => {
    if (!dateString) return '';

    try {
      // Parse date string as local date to avoid timezone shifts
      const dateOnly = dateString.split('T')[0]; // Remove time part if present
      const [year, month, day] = dateOnly.split('-');

      // Create date object with local timezone (no timezone conversion)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

      // Return in a clean format like "August 29, 1987"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      // If date parsing fails, try to extract just the year
      const yearMatch = dateString.match(/(\d{4})/);
      return yearMatch ? yearMatch[1] : '';
    }
  };

  // Helper function to render user avatar
  const renderUserAvatar = (member, gradientColors = "from-vine-500 to-vine-600") => {
    const hasPhoto = member.photo_url && member.photo_url.trim() !== '';

    if (hasPhoto) {
      // Construct the full photo URL
      const photoUrl = member.photo_url.startsWith('http')
        ? member.photo_url
        : `${process.env.REACT_APP_API}/${member.photo_url}`;

      return (
        <img
          src={photoUrl}
          alt={`${member.first_name} ${member.last_name}`}
          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-secondary-700 shadow-sm"
          onError={(e) => {
            // If image fails to load, show initials instead
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }

    // Fallback to initials
    return (
      <div className={`w-10 h-10 bg-gradient-to-br ${gradientColors}
                      rounded-full flex items-center justify-center text-white font-semibold shadow-sm`}>
        {member.first_name?.[0]}{member.last_name?.[0]}
      </div>
    );
  };

  // Load recent searches from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem('familyVine_recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts (Ctrl+K or Cmd+K to open search)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search function with debouncing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API}/api/members/search?q=${encodeURIComponent(searchTerm)}`
        );
        setResults(response.data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms delay for debouncing

    return () => clearTimeout(searchTimer);
  }, [searchTerm]);

  // Handle selecting a search result
  const handleSelectResult = (member) => {
    // Add to recent searches
    const newRecent = [member, ...recentSearches.filter(r => r.id !== member.id)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('familyVine_recentSearches', JSON.stringify(newRecent));

    // Navigate to member page
    navigate(`/members/${member.id}`);

    // Close search
    setIsOpen(false);
    setSearchTerm('');
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('familyVine_recentSearches');
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-vine-600 dark:text-secondary-400
                   bg-vine-100 dark:bg-secondary-800 rounded-lg hover:bg-vine-200 dark:hover:bg-secondary-700
                   transition-colors border border-vine-200 dark:border-secondary-700"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Search</span>
        <span className="text-xs text-vine-sage dark:text-secondary-500 hidden xl:inline ml-1">Ctrl+K</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-vine-dark/40 dark:bg-black/60 backdrop-blur-sm flex items-start justify-center pt-4 sm:pt-20 z-50">
          <div className="card w-full max-w-2xl mx-4 max-h-[70vh] sm:max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-vine-200 dark:border-secondary-700">
              <Search className="w-5 h-5 text-vine-sage" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for family members..."
                className="flex-1 text-lg bg-transparent border-none outline-none
                           text-vine-dark dark:text-white placeholder-secondary-400"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-vine-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-vine-sage" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-vine-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-vine-600 dark:text-secondary-400">Searching...</span>
                </div>
              )}

              {!loading && searchTerm && results.length === 0 && (
                <div className="text-center py-8 text-vine-sage dark:text-secondary-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No family members found for "{searchTerm}"</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-vine-sage dark:text-secondary-400 px-2 py-1 mb-1">
                    Search Results
                  </h3>
                  {results.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectResult(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-vine-50 dark:hover:bg-vine-900/20
                                 rounded-lg transition-colors text-left"
                    >
                      <div className="relative">
                        {renderUserAvatar(member)}
                        {/* Fallback initials (hidden by default, shown if image fails) */}
                        <div className="w-10 h-10 bg-gradient-to-br from-vine-500 to-vine-600
                                        rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                             style={{ display: 'none' }}>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-vine-dark dark:text-white">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-vine-sage dark:text-secondary-400">
                          {member.birth_date && `Born ${formatBirthDate(member.birth_date)}`}
                          {member.birth_place && ` in ${member.birth_place}`}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !searchTerm && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-1">
                    <h3 className="text-sm font-semibold text-vine-sage dark:text-secondary-400">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-vine-sage hover:text-vine-600 dark:hover:text-vine-400"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectResult(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-vine-50 dark:hover:bg-vine-900/20
                                 rounded-lg transition-colors text-left"
                    >
                      <div className="relative">
                        {renderUserAvatar(member, "from-success-500 to-success-600")}
                        {/* Fallback initials for recent searches */}
                        <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600
                                        rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                             style={{ display: 'none' }}>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-vine-dark dark:text-white">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-vine-sage dark:text-secondary-400">
                          Recent search
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !searchTerm && recentSearches.length === 0 && (
                <div className="text-center py-8 text-vine-sage dark:text-secondary-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search your family tree</p>
                  <p className="text-xs mt-1">Use Ctrl+K to quickly open search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
