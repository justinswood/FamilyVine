import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Search, X, Check, User, Info } from 'lucide-react';

const PhotoTagging = ({ photo, albumId, onSaveTag, onDeleteTag, onClose }) => {
  const [existingTags, setExistingTags] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isTagging, setIsTagging] = useState(false);
  const [taggingPosition, setTaggingPosition] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExistingTags, setShowExistingTags] = useState(true);
  const [loading, setLoading] = useState(true);
  const imageRef = useRef(null);

  // Get API base URL from environment
  const API_BASE = process.env.REACT_APP_API;

  // Filter family members based on search
  const filteredMembers = familyMembers.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load existing tags and family members
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load existing tags
        const tagsResponse = await fetch(`${API_BASE}/api/albums/${albumId}/photos/${photo.id}/tags`);
        const tags = await tagsResponse.json();
        setExistingTags(tags);
        
        // Load family members
        const membersResponse = await fetch(`${API_BASE}/api/members`);
        const members = await membersResponse.json();
        setFamilyMembers(members);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [photo.id, albumId, API_BASE]);

  // Handle clicking on the photo to start tagging
  const handleImageClick = useCallback((e) => {
    if (!isTagging) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setTaggingPosition({ x, y });
  }, [isTagging]);

  // Save the tag
  const handleSaveTag = async () => {
    if (selectedMember && taggingPosition) {
      try {
        const member = familyMembers.find(m => m.id === parseInt(selectedMember));
        const tagData = {
          member_id: member.id,
          x_coordinate: taggingPosition.x,
          y_coordinate: taggingPosition.y,
          width: 15, // Default face box width
          height: 20, // Default face box height
          is_verified: true
        };

        const response = await fetch(`${API_BASE}/api/albums/${albumId}/photos/${photo.id}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tagData)
        });

        const newTag = await response.json();
        
        if (response.ok) {
          setExistingTags([...existingTags, newTag]);
          setTaggingPosition(null);
          setSelectedMember('');
          setSearchTerm('');
          setIsTagging(false);
          
          // Call parent callback if provided
          if (onSaveTag) onSaveTag(newTag);
        } else {
          alert(newTag.error || 'Failed to save tag');
        }
      } catch (error) {
        console.error('Error saving tag:', error);
        alert('Failed to save tag');
      }
    }
  };

  // Delete a tag
  const handleDeleteTag = async (tagId) => {
    try {
      const response = await fetch(`${API_BASE}/api/albums/${albumId}/photos/${photo.id}/tags/${tagId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setExistingTags(existingTags.filter(tag => tag.id !== tagId));
        
        // Call parent callback if provided
        if (onDeleteTag) onDeleteTag(tagId);
      } else {
        alert('Failed to delete tag');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Failed to delete tag');
    }
  };

  // Cancel tagging
  const handleCancel = () => {
    setTaggingPosition(null);
    setSelectedMember('');
    setSearchTerm('');
    setIsTagging(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-2">Loading photo tags...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Tag People in Photo</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Photo Container */}
      <div className="relative">
        <img
          ref={imageRef}
          src={photo.file_path?.startsWith('http') ? photo.file_path : `${API_BASE}/${photo.file_path}`}
          alt={photo.caption || photo.original_name || "Family photo"}
          className={`w-full h-auto ${isTagging ? 'cursor-crosshair' : 'cursor-default'}`}
          onClick={handleImageClick}
        />
        
        {/* Existing Tags Display */}
        {showExistingTags && existingTags.map((tag) => (
          <div
            key={tag.id}
            className="absolute group"
            style={{
              left: `${tag.x_coordinate}%`,
              top: `${tag.y_coordinate}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Face Tag Marker - Hidden by default, visible on hover */}
            <div className="relative">
              <div className={`w-16 h-20 border-4 rounded-lg bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity ${
                tag.is_verified ? 'border-blue-500 bg-blue-500' : 'border-yellow-500 bg-yellow-500'
              }`}></div>
              
              {/* Name Label */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {tag.member_name}
                {!tag.is_verified && <span className="ml-1 text-yellow-300">(Unverified)</span>}
                <button
                  onClick={() => handleDeleteTag(tag.id)}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {/* New Tag Position */}
        {taggingPosition && (
          <div
            className="absolute"
            style={{
              left: `${taggingPosition.x}%`,
              top: `${taggingPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-16 h-20 border-4 border-green-500 rounded-lg bg-green-500/20 animate-pulse"></div>
          </div>
        )}
        
        {/* Tagging Mode Overlay */}
        {isTagging && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 text-center">
              <User className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-700">Click on a face to tag someone</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800">
            {photo.caption || photo.original_name || "Family Photo"}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExistingTags(!showExistingTags)}
              className={`p-2 rounded-lg transition-colors ${
                showExistingTags 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showExistingTags ? 'Hide tags' : 'Show tags'}
            >
              <Info className="w-4 h-4" />
            </button>
            {!isTagging ? (
              <button
                onClick={() => setIsTagging(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Tag People
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Photo Info */}
        <div className="text-sm text-gray-600 mb-3">
          <p>Tagged: {existingTags.length} people</p>
          {photo.taken_date && <p>Date: {new Date(photo.taken_date).toLocaleDateString()}</p>}
          {photo.caption && <p>Caption: {photo.caption}</p>}
        </div>
        
        {/* Tagging Interface */}
        {taggingPosition && (
          <div className="bg-white rounded-lg p-4 border space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Who is this person?
            </label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search family members..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Member Selection */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a family member</option>
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                  {member.birth_date && ` (b. ${new Date(member.birth_date).getFullYear()})`}
                </option>
              ))}
            </select>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTag}
                disabled={!selectedMember}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4 mr-1" />
                Save Tag
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Tagged People List */}
        {existingTags.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">People in this photo:</h4>
            <div className="flex flex-wrap gap-2">
              {existingTags.map((tag) => (
                <span
                  key={tag.id}
                  className={`inline-flex items-center px-3 py-1 text-sm rounded-full ${
                    tag.is_verified 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {tag.member_name}
                  {!tag.is_verified && <span className="ml-1">⚠️</span>}
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoTagging;