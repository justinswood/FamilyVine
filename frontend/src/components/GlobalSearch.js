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
      // Create date from the string and format it nicely
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
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
  const renderUserAvatar = (member, gradientColors = "from-blue-500 to-purple-500") => {
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
          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
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
        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 
                   bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 
                   transition-colors border border-gray-200 dark:border-gray-600"
      >
        <Search className="w-3 h-3" />
        <span className="hidden lg:inline">Search</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden xl:inline">Ctrl+K</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-600">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for family members..."
                className="flex-1 text-lg bg-transparent border-none outline-none 
                           text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Search Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
                </div>
              )}

              {!loading && searchTerm && results.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No family members found for "{searchTerm}"</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                    Search Results
                  </h3>
                  {results.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectResult(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                                 rounded-lg transition-colors text-left"
                    >
                      <div className="relative">
                        {renderUserAvatar(member)}
                        {/* Fallback initials (hidden by default, shown if image fails) */}
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 
                                        rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                             style={{ display: 'none' }}>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      Recent Searches
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectResult(member)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 
                                 rounded-lg transition-colors text-left"
                    >
                      <div className="relative">
                        {renderUserAvatar(member, "from-green-500 to-teal-500")}
                        {/* Fallback initials for recent searches */}
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 
                                        rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                             style={{ display: 'none' }}>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Recent search
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !searchTerm && recentSearches.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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