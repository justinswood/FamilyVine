import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PhotoTagger = ({ photo, album, onClose, onTagAdded }) => {
  const [members, setMembers] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
    fetchPhotoTags();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchPhotoTags = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API}/api/albums/${album.id}/photos/${photo.id}`
      );
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Error fetching photo tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTag = async () => {
    if (!selectedMember) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API}/api/albums/${album.id}/photos/${photo.id}/tags`,
        { member_id: selectedMember }
      );
      
      // Find the member name for display
      const member = members.find(m => m.id === parseInt(selectedMember));
      const newTag = {
        member_id: parseInt(selectedMember),
        member_name: `${member.first_name} ${member.last_name}`
      };
      
      setTags([...tags, newTag]);
      setSelectedMember('');
      onTagAdded();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const removeTag = async (tagId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API}/api/albums/${album.id}/photos/${photo.id}/tags/${tagId}`
      );
      setTags(tags.filter(tag => tag.id !== tagId));
      onTagAdded();
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Tag People in Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <img
            src={`${process.env.REACT_APP_API}/${photo.file_path}`}
            alt="Photo to tag"
            className="w-full h-48 object-cover rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tag a family member:</label>
          <div className="flex space-x-2">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select a member...</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>
            <button
              onClick={addTag}
              disabled={!selectedMember}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Tag
            </button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Tagged people:</h3>
          {tags.length === 0 ? (
            <p className="text-gray-500 text-sm">No one is tagged in this photo.</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{tag.member_name}</span>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default PhotoTagger;