/**
 * useTagDragResize Hook
 *
 * Handles coordinate conversion between percentage (database) and pixels (UI)
 * for draggable/resizable photo tags.
 *
 * Tags are stored as percentages (0-100) to remain responsive across different
 * screen sizes, but react-draggable and re-resizable work with pixel coordinates.
 *
 * Usage:
 *   const { getTagPixelPosition, dragToPercent, resizeToPercent } =
 *     useTagDragResize(imageWidth, imageHeight);
 */

import { useCallback } from 'react';

export function useTagDragResize(imageWidth, imageHeight) {
  /**
   * Convert percentage to pixels
   * @param {number} percent - Percentage value (0-100)
   * @param {number} dimension - Image dimension (width or height) in pixels
   * @returns {number} Pixel value
   */
  const percentToPixels = useCallback((percent, dimension) => {
    return (percent / 100) * dimension;
  }, []);

  /**
   * Convert pixels to percentage
   * @param {number} pixels - Pixel value
   * @param {number} dimension - Image dimension (width or height) in pixels
   * @returns {number} Percentage value (0-100)
   */
  const pixelsToPercent = useCallback((pixels, dimension) => {
    return (pixels / dimension) * 100;
  }, []);

  /**
   * Get tag position and size in pixels for rendering
   * @param {Object} tag - Tag object with percentage coordinates
   * @returns {Object} Position and size in pixels { x, y, width, height }
   */
  const getTagPixelPosition = useCallback((tag) => {
    return {
      x: percentToPixels(tag.x_coordinate, imageWidth),
      y: percentToPixels(tag.y_coordinate, imageHeight),
      width: percentToPixels(tag.width, imageWidth),
      height: percentToPixels(tag.height, imageHeight)
    };
  }, [imageWidth, imageHeight, percentToPixels]);

  /**
   * Convert drag position from pixels to percentage
   * Constrains position to image bounds (0-100%)
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @returns {Object} Percentage coordinates { x_coordinate, y_coordinate }
   */
  const dragToPercent = useCallback((x, y) => {
    return {
      x_coordinate: Math.max(0, Math.min(100, pixelsToPercent(x, imageWidth))),
      y_coordinate: Math.max(0, Math.min(100, pixelsToPercent(y, imageHeight)))
    };
  }, [imageWidth, imageHeight, pixelsToPercent]);

  /**
   * Convert resize dimensions from pixels to percentage
   * Constrains size between min (5%) and max (50%)
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   * @returns {Object} Percentage dimensions { width, height }
   */
  const resizeToPercent = useCallback((width, height) => {
    return {
      width: Math.max(5, Math.min(50, pixelsToPercent(width, imageWidth))),
      height: Math.max(5, Math.min(50, pixelsToPercent(height, imageHeight)))
    };
  }, [imageWidth, imageHeight, pixelsToPercent]);

  return {
    getTagPixelPosition,
    dragToPercent,
    resizeToPercent,
    percentToPixels,
    pixelsToPercent
  };
}
