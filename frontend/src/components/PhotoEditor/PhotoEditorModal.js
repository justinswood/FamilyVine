/**
 * PhotoEditorModal Component
 *
 * Main container for the unified photo editing experience.
 * Features:
 * - Tab-based interface for Crop, Rotate, and Tag modes
 * - Undo/redo functionality across all modes
 * - Non-destructive rotation via CSS transform
 * - Integrated toolbar with Save/Cancel actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { API_URL } from '../../config/api';
import EditorToolbar from './EditorToolbar';
import CropMode from './CropMode';
import RotateMode from './RotateMode';
import TagMode from './TagMode';
import './PhotoEditor.css';

export default function PhotoEditorModal({ photo, albumId, onSave, onClose }) {
  // Tab state
  const [activeTab, setActiveTab] = useState('rotate'); // Start with rotate as it's simplest

  // Photo state with undo/redo
  const {
    state: currentPhoto,
    setState: setCurrentPhoto,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  } = useUndoRedo(photo);

  // Loading and error states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tags state (loaded separately)
  const [tags, setTags] = useState([]);

  // Initialize photo state when photo prop changes
  useEffect(() => {
    reset(photo);
    loadTags();
  }, [photo, reset]);

  /**
   * Load tags for the current photo
   */
  const loadTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/tags`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );
      setTags(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  }, [albumId, photo.id]);

  /**
   * Handle photo rotation (non-destructive - stores as metadata, applied via CSS)
   */
  const handleRotate = useCallback(async (degrees) => {
    try {
      setIsSaving(true);
      const response = await axios.put(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/rotate`,
        {
          degrees,
          destructive: false // Non-destructive: store as metadata, apply via CSS
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );

      // Update photo state with new rotation_degrees from server
      setCurrentPhoto({
        ...currentPhoto,
        ...response.data.photo
      });
      setError(null);
    } catch (err) {
      console.error('Error rotating photo:', err);
      setError('Failed to rotate photo');
    } finally {
      setIsSaving(false);
    }
  }, [albumId, photo.id, setCurrentPhoto, currentPhoto]);

  /**
   * Handle photo crop (destructive operation)
   */
  const handleCrop = useCallback(async (crop) => {
    try {
      setIsSaving(true);
      const response = await axios.post(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/crop`,
        {
          crop,
          quality: 0.9 // High quality for photos
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );

      // Update photo state
      setCurrentPhoto(response.data.photo);
      setError(null);

      // Reload tags as their coordinates have been adjusted
      await loadTags();
    } catch (err) {
      console.error('Error cropping photo:', err);
      setError('Failed to crop photo');
    } finally {
      setIsSaving(false);
    }
  }, [albumId, photo.id, setCurrentPhoto, loadTags]);

  /**
   * Handle tag updates (add, update, delete)
   */
  const handleTagUpdate = useCallback(async (tagId, updates) => {
    try {
      await axios.put(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/tags/${tagId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );

      // Reload tags to get updated data
      await loadTags();
      setError(null);
    } catch (err) {
      console.error('Error updating tag:', err);
      setError('Failed to update tag');
    }
  }, [albumId, photo.id, loadTags]);

  const handleTagAdd = useCallback(async (tagData) => {
    try {
      await axios.post(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/tags`,
        tagData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );

      await loadTags();
      setError(null);
    } catch (err) {
      console.error('Error adding tag:', err);
      setError('Failed to add tag');
    }
  }, [albumId, photo.id, loadTags]);

  const handleTagDelete = useCallback(async (tagId) => {
    try {
      await axios.delete(
        `${API_URL}/api/albums/${albumId}/photos/${photo.id}/tags/${tagId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('familyVine_token')}`
          }
        }
      );

      await loadTags();
      setError(null);
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag');
    }
  }, [albumId, photo.id, loadTags]);

  /**
   * Handle save - close editor and notify parent
   */
  const handleSave = useCallback(() => {
    onSave(currentPhoto);
    onClose();
  }, [currentPhoto, onSave, onClose]);

  /**
   * Handle cancel - discard changes and close
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Render mode component based on active tab
  const renderMode = () => {
    switch (activeTab) {
      case 'crop':
        return (
          <CropMode
            photo={currentPhoto}
            onCrop={handleCrop}
            isSaving={isSaving}
          />
        );
      case 'rotate':
        return (
          <RotateMode
            photo={currentPhoto}
            onRotate={handleRotate}
          />
        );
      case 'tag':
        return (
          <TagMode
            photo={currentPhoto}
            tags={tags}
            onTagAdd={handleTagAdd}
            onTagUpdate={handleTagUpdate}
            onTagDelete={handleTagDelete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="photo-editor-overlay" onClick={handleCancel}>
      <div className="photo-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with tabs */}
        <div className="photo-editor-header">
          <h2>Restoration Lab</h2>
          <div className="photo-editor-tabs">
            <button
              className={`tab ${activeTab === 'rotate' ? 'active' : ''}`}
              onClick={() => setActiveTab('rotate')}
            >
              Orient
            </button>
            <button
              className={`tab ${activeTab === 'crop' ? 'active' : ''}`}
              onClick={() => setActiveTab('crop')}
            >
              Crop
            </button>
            <button
              className={`tab ${activeTab === 'tag' ? 'active' : ''}`}
              onClick={() => setActiveTab('tag')}
            >
              Identify
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="photo-editor-error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="photo-editor-loading">
            Loading...
          </div>
        )}

        {/* Active mode content */}
        <div className="photo-editor-content">
          {renderMode()}
        </div>

        {/* Toolbar */}
        <EditorToolbar
          onSave={handleSave}
          onCancel={handleCancel}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
