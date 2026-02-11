import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AddRelationship = ({ member, onRelationshipAdded, onClose }) => {
  const [allMembers, setAllMembers] = useState([]);
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchMembers();
    fetchRelationshipTypes();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter members based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(allMembers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allMembers.filter(m => {
        const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
        return fullName.includes(query);
      });
      setFilteredMembers(filtered);
    }
  }, [searchQuery, allMembers]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      // Filter out the current member from the list
      const filteredMembers = response.data.filter(m => m.id !== member.id);
      setAllMembers(filteredMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    }
  };

  const fetchRelationshipTypes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/relationships/types`);
      setRelationshipTypes(response.data);
    } catch (error) {
      console.error('Error fetching relationship types:', error);
      setError('Failed to load relationship types');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleMemberSelect = (memberId, memberName) => {
    setSelectedMember(memberId);
    setSelectedMemberName(memberName);
    setSearchQuery(memberName);
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMember || !selectedRelationType) {
      setError('Please select both a family member and relationship type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${process.env.REACT_APP_API}/api/relationships`, {
        member1_id: member.id,
        member2_id: parseInt(selectedMember),
        relationship_type: selectedRelationType
      });

      onRelationshipAdded();
      onClose();
    } catch (error) {
      console.error('Error creating relationship:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to create relationship');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add Relationship</h2>
          <button
            onClick={onClose}
            className="text-vine-sage hover:text-vine-dark text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-vine-sage">
            Add a relationship for <strong>{member.first_name} {member.last_name}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={searchRef}>
            <label className="block text-sm font-medium mb-2">
              Select Family Member
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search for a family member..."
              className="w-full border border-vine-200 rounded px-3 py-2"
              autoComplete="off"
              required
            />

            {/* Dropdown with filtered results */}
            {showDropdown && filteredMembers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-vine-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredMembers.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleMemberSelect(m.id, `${m.first_name} ${m.last_name}`)}
                    className="px-3 py-2 hover:bg-vine-50 cursor-pointer border-b border-vine-100 last:border-b-0"
                  >
                    <div className="font-medium">{m.first_name} {m.last_name}</div>
                    {m.birth_date && (
                      <div className="text-xs text-vine-sage">
                        Born: {new Date(m.birth_date).getFullYear()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {showDropdown && searchQuery && filteredMembers.length === 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-vine-200 rounded-lg shadow-lg p-3 text-vine-sage text-sm">
                No family members found matching "{searchQuery}"
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {member.first_name} is their...
            </label>
            <select
              value={selectedRelationType}
              onChange={(e) => setSelectedRelationType(e.target.value)}
              className="w-full border border-vine-200 rounded px-3 py-2"
              required
            >
              <option value="">Choose relationship...</option>
              {relationshipTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded text-white font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-vine-500 to-vine-600 hover:from-vine-600 hover:to-vine-dark'
              }`}
            >
              {loading ? 'Adding...' : 'Add Relationship'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded border border-vine-200 text-vine-dark hover:bg-vine-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRelationship;