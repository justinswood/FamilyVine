import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SearchFilter from '../components/SearchFilter';
import MemberCard from '../components/MemberCard';
import ProfileImage from '../components/ProfileImage';

const MemberList = () => {
  // Your existing state
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  // New state for enhanced features
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Your existing useEffect, with loading state
  useEffect(() => {
    setLoading(true);
    axios.get(`${process.env.REACT_APP_API}/api/members`)
      .then(res => {
        console.log('Members loaded:', res.data);
        const membersData = res.data || [];

        // Sort alphabetically descending by default
        const sortedMembers = [...membersData].sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          return nameB > nameA ? 1 : -1; // Descending order (Z to A)
        });

        setAllMembers(membersData);
        setFilteredMembers(sortedMembers); // ← Now properly sorted
      })
      .catch(err => {
        console.error('Error fetching members:', err);
        // Set empty arrays on error to prevent crashes
        setAllMembers([]);
        setFilteredMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sort functionality - only sort when user changes sort options
  useEffect(() => {
    if (filteredMembers && filteredMembers.length > 0) {
      sortMembers();
    }
  }, [sortBy, sortOrder, allMembers]);

  const sortMembers = () => {
    if (!filteredMembers || filteredMembers.length === 0) return;

    const sorted = [...filteredMembers].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          valueB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'location':
          valueA = (a.location || '').toLowerCase();
          valueB = (b.location || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortOrder === 'desc') {
        return valueA < valueB ? 1 : -1;
      }
      return valueA > valueB ? 1 : -1;
    });

    setFilteredMembers(sorted);
  };

  // FIXED: Function to check if member is deceased with better logic
  const isDeceased = (member) => {
    if (!member) return false; // Safety check

    console.log(`Checking if ${member.first_name || 'Unknown'} is deceased:`, {
      is_alive: member.is_alive,
      death_date: member.death_date
    });

    // Check multiple conditions for deceased status
    return member.is_alive === false ||
      (member.death_date !== null && member.death_date !== undefined && member.death_date !== '');
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto p-3">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading family members...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* ADDED: Same animated background pattern from member page */}
      <div className="absolute inset-0 opacity-3">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="family-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* Family tree branches */}
              <path d="M20,5 L20,35 M5,20 L35,20 M12,12 L28,28 M28,12 L12,28"
                stroke="currentColor" strokeWidth="0.5" className="text-blue-200" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#family-pattern)" />
        </svg>
      </div>

      {/* ADDED: Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-5 -left-5 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-lg"></div>
        <div className="absolute -top-10 -right-10 w-30 h-30 bg-gradient-to-bl from-blue-200/20 to-cyan-200/20 rounded-full blur-lg"></div>
        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gradient-to-t from-purple-200/20 to-pink-200/20 rounded-full blur-lg"></div>
      </div>

      {/* COMPACTED: Main content with smaller padding */}
      <div className="relative z-10 max-w-7xl mx-auto p-3">
        {/* COMPACTED: Enhanced header with smaller spacing */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-4 mb-3 border border-white/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  All Family Members
                </h1>
              </div>
              <p className="text-gray-600 text-sm">Explore and manage your family tree</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/add"
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-md text-sm font-medium"
              >
                ➕ Add Member
              </Link>
              <Link
                to="/settings?tab=import"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-md text-sm font-medium"
              >
                📁 Import CSV
              </Link>
            </div>
          </div>
        </div>

        {/* COMPACTED: Search and Filter Component with smaller spacing */}
        {allMembers && allMembers.length > 0 && (
          <div className="mb-3">
            <SearchFilter
              members={allMembers}
              onFilteredMembers={setFilteredMembers}
              onSearchTerm={setSearchTerm}
            />
          </div>
        )}

        {/* COMPACTED: View Controls with better styling and smaller spacing */}
        {allMembers && allMembers.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-3 mb-3 border border-white/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-3 items-center">
                <span className="text-sm font-medium text-gray-700">👁️ View:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                        ? 'bg-white shadow-sm text-purple-600'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    📋 List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                        ? 'bg-white shadow-sm text-purple-600'
                        : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    ⊞ Grid
                  </button>
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <span className="text-sm font-medium text-gray-700">🔤 Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white shadow-sm"
                >
                  <option value="name">Name</option>
                  <option value="location">Location</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 bg-white shadow-sm font-medium"
                >
                  {sortOrder === 'asc' ? '⬆️ A-Z' : '⬇️ Z-A'}
                </button>
              </div>
            </div>

            {/* ADDED: Member count with better styling */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                📊 Showing <span className="font-semibold text-purple-600">{filteredMembers.length}</span> of{' '}
                <span className="font-semibold">{allMembers.length}</span> family members
                {searchTerm && (
                  <span className="ml-2">
                    for "<span className="font-semibold text-blue-600">{searchTerm}</span>"
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Members Display with backdrop */}
        <div className="bg-white/60 backdrop-blur-sm shadow-lg rounded-xl p-4 border border-white/50">
          {!filteredMembers || filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-lg text-gray-500 mb-2">
                {searchTerm
                  ? `No members found matching "${searchTerm}"`
                  : allMembers && allMembers.length === 0
                    ? 'No family members found yet!'
                    : 'No members match your current filters.'
                }
              </p>
              {allMembers && allMembers.length > 0 && searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 text-blue-600 hover:underline font-medium"
                >
                  🔍 Clear search
                </button>
              )}
              {(!allMembers || allMembers.length === 0) && (
                <Link
                  to="/add"
                  className="mt-4 inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg font-medium"
                >
                  ➕ Add First Family Member
                </Link>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'list' ? (
                // COMPACTED: List view with smaller spacing
                <div className="space-y-3">
                  {filteredMembers.map(member => {
                    // Safety check for each member
                    if (!member || !member.id) {
                      return null;
                    }

                    return (
                      <div key={member.id} className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-sm border border-white/50 flex items-center space-x-3 hover:shadow-md transition-all">
                        <div className="relative inline-block">
                          <ProfileImage
                            member={member}
                            size="w-12 h-12"
                            className=""
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
                            <span className="truncate">
                              {member.first_name || 'Unknown'} {member.middle_name && `${member.middle_name} `}{member.last_name || ''}
                            </span>
                            {/* Deceased icon moved to after the name */}
                            {isDeceased(member) && (
                              <span
                                className="text-gray-600 ml-1 flex-shrink-0"
                                title="Deceased"
                                style={{ fontSize: '1.2em', lineHeight: '1' }}
                              >
                                ✝
                              </span>
                            )}
                          </h2>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <p className="text-gray-600 text-sm">📍 {member.location || '—'}</p>
                            {member.occupation && (
                              <p className="text-gray-500 text-sm">💼 {member.occupation}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/members/${member.id}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm font-medium"
                          >
                            👁️ View
                          </Link>
                          <Link
                            to={`/members/${member.id}/edit`}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all text-sm font-medium"
                          >
                            ✏️ Edit
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // COMPACTED: Grid view with better spacing and more items per row
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {filteredMembers.map(member => {
                    // Safety check for each member
                    if (!member || !member.id) {
                      return null;
                    }

                    return (
                      <MemberCard key={member.id} member={member} />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberList;