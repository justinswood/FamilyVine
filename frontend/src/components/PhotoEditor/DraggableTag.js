/**
 * DraggableTag Component
 *
 * A draggable and resizable tag component for photo tagging.
 * Uses react-draggable for drag functionality and re-resizable for resize.
 * Coordinates are stored as percentages in the database but rendered as pixels.
 */

import React from 'react';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { useTagDragResize } from '../../hooks/useTagDragResize';

export default function DraggableTag({
  tag,
  imageWidth,
  imageHeight,
  onUpdate,
  onDelete,
  isEditing = true
}) {
  const { getTagPixelPosition, dragToPercent, resizeToPercent } =
    useTagDragResize(imageWidth, imageHeight);

  // Convert percentage coordinates to pixels for rendering
  const pixelPos = getTagPixelPosition(tag);

  /**
   * Handle drag stop event
   * Convert pixel position back to percentage and update tag
   */
  const handleDragStop = (e, data) => {
    const newCoords = dragToPercent(data.x, data.y);
    onUpdate(tag.id, newCoords);
  };

  /**
   * Handle resize stop event
   * Convert pixel dimensions back to percentage and update tag
   */
  const handleResizeStop = (e, direction, ref, delta, position) => {
    const newSize = resizeToPercent(
      ref.offsetWidth,
      ref.offsetHeight
    );

    // Also update position if it changed during resize
    const newCoords = dragToPercent(position.x, position.y);

    onUpdate(tag.id, {
      ...newCoords,
      ...newSize
    });
  };

  // Determine tag styling based on verification status
  const tagClassName = `
    photo-tag
    ${tag.is_verified ? 'verified' : 'unverified'}
    ${isEditing ? 'editing' : 'view-only'}
  `;

  return (
    <Draggable
      position={{ x: pixelPos.x, y: pixelPos.y }}
      onStop={handleDragStop}
      bounds="parent"
      disabled={!isEditing}
      handle={isEditing ? '.tag-handle' : null}
    >
      <div style={{ position: 'absolute', cursor: isEditing ? 'move' : 'default' }}>
        <Resizable
          size={{ width: pixelPos.width, height: pixelPos.height }}
          onResizeStop={handleResizeStop}
          enable={isEditing ? {
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true
          } : false}
          minWidth={20}
          minHeight={20}
          maxWidth={imageWidth * 0.5}
          maxHeight={imageHeight * 0.5}
          handleStyles={{
            top: { borderColor: '#D4AF37' },
            right: { borderColor: '#D4AF37' },
            bottom: { borderColor: '#D4AF37' },
            left: { borderColor: '#D4AF37' },
            topRight: { borderColor: '#D4AF37' },
            bottomRight: { borderColor: '#D4AF37' },
            bottomLeft: { borderColor: '#D4AF37' },
            topLeft: { borderColor: '#D4AF37' },
          }}
        >
          <div className={tagClassName}>
            {/* Drag handle - only visible when editing */}
            {isEditing && (
              <div className="tag-handle" title="Drag to move">
                ⋮⋮
              </div>
            )}

            {/* Member name */}
            <span className="tag-name" title={tag.member_name}>
              {tag.member_name}
            </span>

            {/* Delete button - only visible when editing */}
            {isEditing && (
              <button
                className="tag-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tag.id);
                }}
                aria-label={`Delete tag for ${tag.member_name}`}
                title="Delete tag"
              >
                ×
              </button>
            )}

            {/* Verification indicator */}
            {!tag.is_verified && (
              <span className="tag-unverified-indicator" title="Unverified tag">
                ?
              </span>
            )}
          </div>
        </Resizable>
      </div>
    </Draggable>
  );
}
