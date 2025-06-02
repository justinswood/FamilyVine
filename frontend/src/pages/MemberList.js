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
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-600">Loading family members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Enhanced header with actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">All Family Members</h1>
        <div className="flex gap-4">
          <Link
            to="/add"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Member
          </Link>
          <Link
            to="/settings?tab=import"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Import CSV
          </Link>
        </div>
      </div>

      {/* Search and Filter Component - only show if we have members */}
      {allMembers && allMembers.length > 0 && (
        <SearchFilter
          members={allMembers}
          onFilteredMembers={setFilteredMembers}
          onSearchTerm={setSearchTerm}
        />
      )}

      {/* View Controls - only show if we have members */}
      {allMembers && allMembers.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              Grid
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="name">Name</option>
              <option value="location">Location</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Members Display */}
      {!filteredMembers || filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm 
              ? `No members found matching "${searchTerm}"` 
              : allMembers && allMembers.length === 0 
                ? 'No family members found. Add your first family member to get started!'
                : 'No members match your current filters.'
            }
          </p>
          {allMembers && allMembers.length > 0 && searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
          {(!allMembers || allMembers.length === 0) && (
            <Link
              to="/add"
              className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Add First Family Member
            </Link>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            // UPDATED list view - using ProfileImage component with safety checks
            <div className="space-y-4">
              {filteredMembers.map(member => {
                // Safety check for each member
                if (!member || !member.id) {
                  return null;
                }
                
                return (
                  <div key={member.id} className="bg-white p-4 rounded shadow flex items-center space-x-4">
                    <div className="relative inline-block">
                      <ProfileImage 
                        member={member} 
                        size="small"
                        className=""
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <span>
                          {member.first_name || 'Unknown'} {member.middle_name && `${member.middle_name} `}{member.last_name || ''}
                        </span>
                        {/* Deceased icon moved to after the name */}
                        {isDeceased(member) && (
                          <span 
                            className="text-gray-600 ml-1" 
                            title="Deceased"
                            style={{ fontSize: '1.5em', lineHeight: '1' }}
                          >
                            ✝
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-600">{member.location || '—'}</p>
                      {member.occupation && (
                        <p className="text-gray-500 text-sm">{member.occupation}</p>
                      )}
                    </div>
                    <div className="space-x-4">
                      <Link to={`/members/${member.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                      <Link to={`/members/${member.id}/edit`} className="text-yellow-700 hover:underline">
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Grid view using MemberCard component with safety checks
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  );
};

export default MemberList;