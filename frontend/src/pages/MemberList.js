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
  const [loading, setLoading] = useState(true);

  // New state for enhanced features
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Your existing useEffect and functions remain the same
  useEffect(() => {
    setLoading(true);
    axios.get(`${process.env.REACT_APP_API}/api/members`)
      .then(res => {
        console.log('Members loaded:', res.data);
        const membersData = res.data || [];
        const sortedMembers = [...membersData].sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          return nameB > nameA ? 1 : -1;
        });
        setAllMembers(membersData);
        setFilteredMembers(sortedMembers);
      })
      .catch(err => {
        console.error('Error fetching members:', err);
        setAllMembers([]);
        setFilteredMembers([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Function to filter members based on search term and then sort them
  const filterAndSortMembers = () => {
    if (!allMembers || allMembers.length === 0) return;

    let filtered = [...allMembers];

    // Apply search filter if there's a search term
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

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
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
        case 'age':
          // Calculate age from birth_date or birth_year
          const getAge = (member) => {
            if (member.birth_date) {
              const birthDate = new Date(member.birth_date);
              const today = new Date();
              let age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              return age;
            } else if (member.birth_year) {
              return new Date().getFullYear() - parseInt(member.birth_year);
            }
            return 0; // Unknown age goes to end
          };
          valueA = getAge(a);
          valueB = getAge(b);
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

  // Add useEffect to handle search filtering and sorting
  useEffect(() => {
    if (allMembers && allMembers.length > 0) {
      filterAndSortMembers();
    }
  }, [searchTerm, allMembers, sortBy, sortOrder]);

  const isDeceased = (member) => {
    if (!member) return false;
    return member.is_alive === false ||
      (member.death_date !== null && member.death_date !== undefined && member.death_date !== '');
  };

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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#fee440' }}>
      {/* Animated SVG Background */}
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
        <g filter="url(#goo)">
          <circle cx="20%" cy="30%" r="80" fill="#00a8cc">
            <animate attributeName="cx" values="20%;80%;20%" dur="20s" repeatCount="indefinite" begin="0s" />
            <animate attributeName="cy" values="30%;70%;30%" dur="15s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="70%" cy="60%" r="60" fill="#9b59b6">
            <animate attributeName="cx" values="70%;30%;70%" dur="18s" repeatCount="indefinite" begin="0s" />
            <animate attributeName="cy" values="60%;40%;60%" dur="12s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="30%" cy="70%" r="70" fill="#f97068">
            <animate attributeName="cx" values="30%;60%;30%" dur="22s" repeatCount="indefinite" begin="0s" />
            <animate attributeName="cy" values="70%;20%;70%" dur="16s" repeatCount="indefinite" begin="0s" />
          </circle>
          <circle cx="60%" cy="30%" r="50" fill="#00d9ff">
            <animate attributeName="cx" values="60%;20%;60%" dur="19s" repeatCount="indefinite" begin="0s" />
            <animate attributeName="cy" values="30%;80%;30%" dur="14s" repeatCount="indefinite" begin="0s" />
          </circle>
        </g>
      </svg>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto p-2">

        {/* 🎯 COMPACT HEADER - 50% smaller version */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-xl p-1 mb-2 border border-white/50">

          {/* Top Row: Title + Add Member Button (Import CSV removed) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1 mb-1.5">
            <div className="flex items-center gap-1">
              <div className="p-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  All Family Members
                </h1>
                <p className="text-xs text-gray-600">Explore and manage your family tree</p>
              </div>
            </div>

            <div className="flex gap-1">
              <Link
                to="/add"
                className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all shadow-lg font-medium text-xs"
              >
                <span className="text-xs">➕</span>
                Add Member
              </Link>
            </div>
          </div>

          {/* Middle Row: Search Bar (made more compact) */}
          <div className="mb-1.5">
            <div className="relative max-w-2xl mx-auto">
              <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-3 py-1 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: View Controls + Count (made more compact) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1.5">

            {/* Left Side: View Toggle + Sort Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-gray-700 flex items-center gap-0.5">
                  <span className="text-xs">👁️</span>
                  View:
                </span>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${viewMode === 'list'
                      ? 'bg-white shadow-sm text-purple-600'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <span className="text-xs">📋</span>
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${viewMode === 'grid'
                      ? 'bg-white shadow-sm text-purple-600'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <span className="text-xs">⊞</span>
                    Grid
                  </button>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-gray-700 flex items-center gap-0.5">
                  <span className="text-xs">🔤</span>
                  Sort:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-1.5 py-0.5 text-[10px] bg-white shadow-sm"
                >
                  <option value="name">Name</option>
                  <option value="location">Location</option>
                  <option value="age">Age</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 border border-gray-300 rounded-lg text-[10px] hover:bg-gray-50 bg-white shadow-sm font-medium"
                >
                  <span className="text-xs">{sortOrder === 'asc' ? '⬆️' : '⬇️'}</span>
                  {sortBy === 'age'
                    ? (sortOrder === 'asc' ? 'Young→Old' : 'Old→Young')
                    : (sortOrder === 'asc' ? 'A-Z' : 'Z-A')
                  }
                </button>
              </div>
            </div>

            {/* Right Side: Member Count */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 px-2 py-0.5 rounded-lg border border-blue-100">
              <span className="text-xs">📊</span>
              <span className="text-[10px] text-gray-600">
                Showing <span className="font-semibold text-purple-600">{filteredMembers.length}</span> of{' '}
                <span className="font-semibold">{allMembers.length}</span> family members
                {searchTerm && (
                  <span className="ml-2">
                    for "<span className="font-semibold text-blue-600">{searchTerm}</span>"
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Members Display */}
        <div className="bg-white/60 backdrop-blur-sm shadow-lg rounded-xl p-3 border border-white/50">
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
                <div className="space-y-3">
                  {filteredMembers.map(member => {
                    if (!member || !member.id) return null;

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
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/members/${member.id}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all text-sm font-medium"
                          >
                            View
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  {filteredMembers.map(member => {
                    if (!member || !member.id) return null;
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