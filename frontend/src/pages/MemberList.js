// frontend/src/pages/MemberList.js
// UPDATED VERSION - Remove getPhotoUrl and use ProfileImage component

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SearchFilter from '../components/SearchFilter';
import MemberCard from '../components/MemberCard';
import ProfileImage from '../components/ProfileImage'; // ADD THIS IMPORT

const MemberList = () => {
  // Your existing state
  const [allMembers, setAllMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]); // New: for filtered results
  // REMOVE: const [imageErrors, setImageErrors] = useState(new Set()); // Delete this line
  
  // New state for enhanced features
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Your existing useEffect, slightly modified
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API}/api/members`)
      .then(res => {
        console.log('Members loaded:', res.data); // Debug log
        setAllMembers(res.data);
        setFilteredMembers(res.data); // Initialize filtered members
      })
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  // Sort functionality - only sort when user changes sort options
  useEffect(() => {
    if (filteredMembers.length > 0) {
      sortMembers();
    }
  }, [sortBy, sortOrder]);

  const sortMembers = () => {
    const sorted = [...filteredMembers].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'name':
          valueA = `${a.first_name} ${a.last_name}`.toLowerCase();
          valueB = `${b.first_name} ${b.last_name}`.toLowerCase();
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

  // REMOVE ALL OLD getPhotoUrl and handleImageError functions
  // DELETE these functions completely:
  /*
  const getPhotoUrl = (member) => { ... }
  const handleImageError = (memberId) => { ... }
  */

  // FIXED: Function to check if member is deceased with better logic
  const isDeceased = (member) => {
    console.log(`Checking if ${member.first_name} is deceased:`, {
      is_alive: member.is_alive,
      death_date: member.death_date
    }); // Debug log
    
    // Check multiple conditions for deceased status
    return member.is_alive === false || 
           (member.death_date !== null && member.death_date !== undefined && member.death_date !== '');
  };

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
            to="/csv-import"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Import CSV
          </Link>
        </div>
      </div>

      {/* NEW: Search and Filter Component */}
      <SearchFilter
        members={allMembers}
        onFilteredMembers={setFilteredMembers}
        onSearchTerm={setSearchTerm}
      />

      {/* NEW: View Controls */}
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

      {/* Enhanced Members Display */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm 
              ? `No members found matching "${searchTerm}"` 
              : 'No family members found.'
            }
          </p>
          {allMembers.length > 0 && searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            // UPDATED list view - using ProfileImage component
            <div className="space-y-4">
              {filteredMembers.map(member => (
                <div key={member.id} className="bg-white p-4 rounded shadow flex items-center space-x-4">
                  <div className="relative inline-block">
                    {/* REPLACED: Old img tag with ProfileImage component */}
                    <ProfileImage 
                      member={member} 
                      size="small"
                      className=""
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>{member.first_name} {member.middle_name && `${member.middle_name} `}{member.last_name}</span>
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
              ))}
            </div>
          ) : (
            // Grid view using MemberCard component (this should already work)
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMembers.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemberList;