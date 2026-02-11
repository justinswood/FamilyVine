/**
 * CropMode Component
 *
 * Provides image cropping interface using react-image-crop.
 * Crops are applied server-side and are destructive (original is backed up).
 */

import React, { useState, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { API_URL } from '../../config/api';

export default function CropMode({ photo, onCrop, isSaving }) {
  // Crop state (stored as percentages for consistency)
  const [crop, setCrop] = useState({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState(null);

  // Image ref for crop calculations
  const [imageRef, setImageRef] = useState(null);

  /**
   * Handle crop complete
   * Convert crop to percentage if needed and send to parent
   */
  const handleCropComplete = useCallback(() => {
    if (!crop || crop.width === 0 || crop.height === 0) {
      alert('Please select a crop area');
      return;
    }

    // Ensure crop is in percentage format
    const percentCrop = crop.unit === '%' ? crop : convertToPercent(crop);

    onCrop(percentCrop);
  }, [crop, onCrop]);

  /**
   * Convert pixel crop to percentage
   */
  const convertToPercent = (pixelCrop) => {
    if (!imageRef) return pixelCrop;

    const { width, height } = imageRef;
    return {
      x: (pixelCrop.x / width) * 100,
      y: (pixelCrop.y / height) * 100,
      width: (pixelCrop.width / width) * 100,
      height: (pixelCrop.height / height) * 100
    };
  };

  /**
   * Handle aspect ratio selection
   */
  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);

    // Reset crop when aspect ratio changes
    if (ratio) {
      setCrop({
        unit: '%',
        width: 50,
        height: 50 / ratio,
        x: 25,
        y: 25
      });
    } else {
      setCrop({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25
      });
    }
  };

  /**
   * Apply CSS rotation if photo has rotation_degrees
   */
  const imageStyle = {
    transform: `rotate(${photo.rotation_degrees || 0}deg)`,
    maxWidth: '100%',
    maxHeight: '40vh'
  };

  return (
    <div className="crop-mode">
      {/* Aspect ratio controls */}
      <div className="crop-controls">
        <label>Aspect Ratio:</label>
        <div className="aspect-ratio-buttons">
          <button
            className={aspectRatio === null ? 'active' : ''}
            onClick={() => handleAspectRatioChange(null)}
          >
            Free
          </button>
          <button
            className={aspectRatio === 1 ? 'active' : ''}
            onClick={() => handleAspectRatioChange(1)}
          >
            1:1
          </button>
          <button
            className={aspectRatio === 4/3 ? 'active' : ''}
            onClick={() => handleAspectRatioChange(4/3)}
          >
            4:3
          </button>
          <button
            className={aspectRatio === 16/9 ? 'active' : ''}
            onClick={() => handleAspectRatioChange(16/9)}
          >
            16:9
          </button>
          <button
            className={aspectRatio === 3/2 ? 'active' : ''}
            onClick={() => handleAspectRatioChange(3/2)}
          >
            3:2
          </button>
        </div>
      </div>

      {/* Crop area */}
      <div className="crop-canvas">
        <ReactCrop
          crop={crop}
          onChange={(newCrop) => setCrop(newCrop)}
          aspect={aspectRatio}
          minWidth={50} // Minimum 50px
          minHeight={50}
        >
          <img
            ref={setImageRef}
            src={`${API_URL}/${photo.file_path}`}
            alt={photo.caption || 'Photo to crop'}
            style={imageStyle}
            onLoad={() => {
              // Reset crop when image loads
              setCrop({
                unit: '%',
                width: 50,
                height: 50,
                x: 25,
                y: 25
              });
            }}
          />
        </ReactCrop>
      </div>

      {/* Apply button */}
      <div className="crop-actions">
        <button
          className="btn-apply-crop"
          onClick={handleCropComplete}
          disabled={isSaving || !crop || crop.width === 0}
        >
          {isSaving ? 'Cropping...' : 'Apply Crop'}
        </button>
        <p className="crop-warning">
          ⚠️ Cropping is permanent. Original will be backed up.
        </p>
      </div>
    </div>
  );
}
