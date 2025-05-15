import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddRelationship = ({ member, onRelationshipAdded, onClose }) => {
  const [allMembers, setAllMembers] = useState([]);
  const [relationshipTypes, setRelationshipTypes] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchRelationshipTypes();
  }, []);

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
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Add a relationship for <strong>{member.first_name} {member.last_name}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Family Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Choose a family member...</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {member.first_name} is their...
            </label>
            <select
              value={selectedRelationType}
              onChange={(e) => setSelectedRelationType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
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
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Adding...' : 'Add Relationship'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
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