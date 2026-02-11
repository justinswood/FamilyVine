/**
 * TagMode Component
 *
 * Provides photo tagging interface with draggable/resizable tags.
 * Features:
 * - Click-to-tag with member search
 * - Drag and resize existing tags
 * - Tag list sidebar
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import DraggableTag from './DraggableTag';
import { API_URL } from '../../config/api';

export default function TagMode({ photo, tags, onTagAdd, onTagUpdate, onTagDelete }) {
  // Tagging mode state
  const [isTagging, setIsTagging] = useState(false);
  const [pendingTagPosition, setPendingTagPosition] = useState(null);

  // Member search state
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  // Glow animation state for newly placed tags
  const [showGlow, setShowGlow] = useState(false);

  // Image dimensions for coordinate conversion
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);

  /**
   * Load all members for search
   */
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/members`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        });
        setMembers(response.data);
      } catch (err) {
        console.error('Error loading members:', err);
      }
    };

    loadMembers();
  }, []);

  /**
   * Filter members based on search query
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = members.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(query)
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  /**
   * Handle image load to get dimensions
   */
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      });
    }
  }, []);

  /**
   * Handle click on image to start tagging
   */
  const handleImageClick = useCallback((e) => {
    if (!isTagging) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    setPendingTagPosition({ x: xPercent, y: yPercent });
    setShowMemberSearch(true);
    setSearchQuery('');
  }, [isTagging]);

  /**
   * Handle member selection for new tag
   */
  const handleMemberSelect = useCallback(async (member) => {
    if (!pendingTagPosition) return;

    const tagData = {
      member_id: member.id,
      x_coordinate: pendingTagPosition.x,
      y_coordinate: pendingTagPosition.y,
      width: 15, // Default 15% width
      height: 15, // Default 15% height
      is_verified: true
    };

    await onTagAdd(tagData);

    // Trigger glow animation on the image container
    setShowGlow(true);
    setTimeout(() => setShowGlow(false), 800);

    // Reset state
    setPendingTagPosition(null);
    setShowMemberSearch(false);
    setIsTagging(false);
    setSearchQuery('');
  }, [pendingTagPosition, onTagAdd]);

  /**
   * Cancel pending tag
   */
  const handleCancelTag = useCallback(() => {
    setPendingTagPosition(null);
    setShowMemberSearch(false);
    setIsTagging(false);
    setSearchQuery('');
  }, []);

  /**
   * Apply CSS rotation if photo has rotation_degrees
   */
  const imageStyle = {
    transform: `rotate(${photo.rotation_degrees || 0}deg)`,
    maxWidth: '100%',
    maxHeight: '40vh',
    cursor: isTagging ? 'crosshair' : 'default'
  };

  return (
    <div className="tag-mode">
      {/* Tag controls */}
      <div className="tag-controls">
        <button
          className={`btn-add-tag ${isTagging ? 'active' : ''}`}
          onClick={() => setIsTagging(!isTagging)}
        >
          {isTagging ? 'Cancel Tagging' : '+ Add Tag'}
        </button>

        {isTagging && (
          <p className="tag-instruction">
            Click on the photo to tag a person
          </p>
        )}
      </div>

      {/* Main content area */}
      <div className="tag-content">
        {/* Image canvas with tags */}
        <div className="tag-canvas">
          <div className={`tag-image-container${showGlow ? ' tag-glow-active' : ''}`} style={{ position: 'relative' }}>
            <img
              ref={imageRef}
              src={`${API_URL}/${photo.file_path}`}
              alt={photo.caption || 'Photo to tag'}
              style={imageStyle}
              onClick={handleImageClick}
              onLoad={handleImageLoad}
            />

            {/* Render draggable tags */}
            {imageDimensions.width > 0 && tags.map(tag => (
              <DraggableTag
                key={tag.id}
                tag={tag}
                imageWidth={imageDimensions.width}
                imageHeight={imageDimensions.height}
                onUpdate={onTagUpdate}
                onDelete={onTagDelete}
                isEditing={true}
              />
            ))}
          </div>
        </div>

        {/* Tag list sidebar */}
        <div className="tag-sidebar">
          <h3>Who's in This Photo ({tags.length})</h3>
          <div className="tag-list">
            {tags.length === 0 ? (
              <p className="no-tags">No one tagged yet</p>
            ) : (
              tags.map(tag => (
                <div key={tag.id} className="tag-list-item">
                  <div className="tag-member-info">
                    <span className="tag-member-initial">
                      {tag.member_name ? tag.member_name.charAt(0).toUpperCase() : '?'}
                    </span>
                    <span className="tag-member-name">{tag.member_name}</span>
                  </div>
                  <div className="tag-list-actions">
                    {!tag.is_verified && (
                      <button
                        className="btn-verify-tag"
                        onClick={() => onTagUpdate(tag.id, { is_verified: true })}
                        title="Verify tag"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="btn-delete-tag-list"
                      onClick={() => onTagDelete(tag.id)}
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Member search modal */}
      {showMemberSearch && (
        <div className="member-search-modal" onWheel={(e) => e.stopPropagation()}>
          <div className="member-search-content">
            <h3>Select Person to Tag</h3>

            <input
              type="text"
              placeholder="Search for a person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="member-search-input"
            />

            <div className="member-search-results">
              {filteredMembers.length === 0 ? (
                <p className="no-results">No members found</p>
              ) : (
                filteredMembers.slice(0, 10).map(member => (
                  <div
                    key={member.id}
                    className="member-search-item"
                    onClick={() => handleMemberSelect(member)}
                  >
                    <div className="member-search-item-info">
                      <span className="member-search-initial">
                        {member.first_name ? member.first_name.charAt(0).toUpperCase() : '?'}
                      </span>
                      <span className="member-name">
                        {member.first_name} {member.last_name}
                      </span>
                    </div>
                    {member.birth_date && (
                      <span className="member-birth-year">
                        b. {new Date(member.birth_date).getFullYear()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              className="btn-cancel-member-search"
              onClick={handleCancelTag}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
