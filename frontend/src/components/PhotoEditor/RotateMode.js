/**
 * RotateMode Component — Curator's Toolkit
 *
 * Provides non-destructive image rotation interface with heritage aesthetics.
 * Rotation is stored as metadata and applied via CSS transform.
 * Original file is never modified.
 */

import React from 'react';
import { API_URL } from '../../config/api';

export default function RotateMode({ photo, onRotate }) {
  /**
   * Handle rotation button click
   */
  const handleRotate = (degrees) => {
    onRotate(degrees);
  };

  /**
   * Get current rotation in degrees (normalized to 0-359)
   */
  const currentRotation = ((photo.rotation_degrees || 0) % 360 + 360) % 360;

  /**
   * Apply CSS rotation for preview with watercolor fade transition
   */
  const imageStyle = {
    transform: `rotate(${photo.rotation_degrees || 0}deg)`,
    transition: 'transform 0.4s ease-out',
    maxWidth: '100%',
    maxHeight: '55vh',
    objectFit: 'contain'
  };

  /**
   * Get rotation display text
   */
  const getOrientationLabel = () => {
    const normalized = currentRotation;
    if (normalized === 0) return 'Original';
    if (normalized === 90) return '90° CW';
    if (normalized === 180) return '180°';
    if (normalized === 270) return '90° CCW';
    return `${normalized}°`;
  };

  return (
    <div className="rotate-mode-compact">
      <div className="rotate-container">
        {/* Curator's Toolkit — Horizontal Button Bar */}
        <div className="curator-toolbar">
          {/* Main Rotation Buttons */}
          <div className="curator-btn-group">
            <button
              className="restoration-tool-btn"
              onClick={() => handleRotate(-90)}
              title="Rotate 90° counter-clockwise"
            >
              <span className="btn-icon">↺</span>
              <span className="btn-label">90° CCW</span>
            </button>
            <button
              className="restoration-tool-btn"
              onClick={() => handleRotate(90)}
              title="Rotate 90° clockwise"
            >
              <span className="btn-icon">↻</span>
              <span className="btn-label">90° CW</span>
            </button>
            <button
              className="restoration-tool-btn"
              onClick={() => handleRotate(180)}
              title="Rotate 180°"
            >
              <span className="btn-icon">⟳</span>
              <span className="btn-label">180°</span>
            </button>
          </div>

          {/* Orientation Marker */}
          <div className="orientation-marker">
            <span className="fleur-de-lis">⚜</span>
            <span className="orientation-label">{getOrientationLabel()}</span>
          </div>

          {/* Fine-Tune Nudge Buttons */}
          <div className="curator-btn-group fine-tune-group">
            <span className="fine-tune-label">Fine-Tune</span>
            <button
              className="restoration-tool-btn nudge-btn"
              onClick={() => handleRotate(-1)}
              title="Nudge 1° counter-clockwise"
            >
              <span className="btn-icon">−1°</span>
            </button>
            <button
              className="restoration-tool-btn nudge-btn"
              onClick={() => handleRotate(1)}
              title="Nudge 1° clockwise"
            >
              <span className="btn-icon">+1°</span>
            </button>
          </div>

          {/* Restore Original Button */}
          {currentRotation !== 0 && (
            <button
              className="restoration-tool-btn restore-btn"
              onClick={() => onRotate(-photo.rotation_degrees)}
              title="Restore to original orientation"
            >
              <span className="btn-icon">⟲</span>
              <span className="btn-label">Restore Original</span>
            </button>
          )}
        </div>

        {/* Photo Preview */}
        <div className="rotate-image-area">
          <img
            src={`${API_URL}/${photo.file_path}`}
            alt={photo.caption || 'Photo to rotate'}
            style={imageStyle}
          />
        </div>
      </div>
    </div>
  );
}
