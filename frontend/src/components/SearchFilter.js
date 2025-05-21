import React, { useState, useEffect } from 'react';

const SearchFilter = ({ members, onFilteredMembers, onSearchTerm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: '',
    isAlive: '',
    hasLocation: '',
    hasPhoto: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Only filter if members array exists and has items
    if (members && members.length > 0) {
      filterMembers();
    }
  }, [searchTerm, filters, members]);

  const filterMembers = () => {
    // Start with all members
    let filtered = [...members];

    // Search filter - only apply if there's a search term
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(member => {
        const fullName = `${member.first_name || ''} ${member.middle_name || ''} ${member.last_name || ''}`.toLowerCase();
        const location = (member.location || '').toLowerCase();
        const occupation = (member.occupation || '').toLowerCase();
        const email = (member.email || '').toLowerCase();
        
        return fullName.includes(searchTerm.toLowerCase()) ||
               location.includes(searchTerm.toLowerCase()) ||
               occupation.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase());
      });
    }

    // Gender filter
    if (filters.gender) {
      filtered = filtered.filter(member => member.gender === filters.gender);
    }

    // Alive status filter
    if (filters.isAlive !== '') {
      const isAlive = filters.isAlive === 'true';
      filtered = filtered.filter(member => {
        // Handle cases where is_alive might be 1/0, true/false, or null
        if (member.is_alive === null || member.is_alive === undefined) {
          return isAlive; // Assume alive if not specified
        }
        return Boolean(member.is_alive) === isAlive;
      });
    }

    // Location filter
    if (filters.hasLocation !== '') {
      const hasLocation = filters.hasLocation === 'true';
      filtered = filtered.filter(member => 
        hasLocation ? (member.location && member.location.trim() !== '') : (!member.location || member.location.trim() === '')
      );
    }

    // Photo filter
    if (filters.hasPhoto !== '') {
      const hasPhoto = filters.hasPhoto === 'true';
      filtered = filtered.filter(member => 
        hasPhoto ? (member.photo_url && member.photo_url.trim() !== '') : (!member.photo_url || member.photo_url.trim() === '')
      );
    }

    onFilteredMembers(filtered);
    onSearchTerm(searchTerm);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      gender: '',
      isAlive: '',
      hasLocation: '',
      hasPhoto: ''
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, location, occupation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 relative"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear Filters */}
        {(searchTerm || activeFilterCount > 0) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.isAlive}
                onChange={(e) => handleFilterChange('isAlive', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Living</option>
                <option value="false">Deceased</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={filters.hasLocation}
                onChange={(e) => handleFilterChange('hasLocation', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Has Location</option>
                <option value="false">No Location</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <select
                value={filters.hasPhoto}
                onChange={(e) => handleFilterChange('hasPhoto', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="true">Has Photo</option>
                <option value="false">No Photo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mt-4 text-sm text-gray-600">
        <span>Showing {members.length} family members</span>
        {searchTerm && (
          <span className="ml-2">for "{searchTerm}"</span>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;