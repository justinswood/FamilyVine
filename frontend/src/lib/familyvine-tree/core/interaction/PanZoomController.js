/**
 * PanZoomController - Handles pan and zoom interactions
 * Provides smooth mouse/touch pan, wheel zoom, and programmatic view control
 */

import { LayoutConfig } from '../layout/LayoutConfig.js';

export class PanZoomController {
  constructor(svg, config = {}) {
    this.svg = svg;
    this.config = {
      minZoom: config.minZoom || LayoutConfig.ZOOM_MIN,
      maxZoom: config.maxZoom || LayoutConfig.ZOOM_MAX,
      initialZoom: config.initialZoom || LayoutConfig.ZOOM_INITIAL,
      zoomSpeed: config.zoomSpeed || 0.1,
      smoothing: config.smoothing !== false, // Default true
      transitionDuration: config.transitionDuration || LayoutConfig.TRANSITION_DURATION,
      ...config
    };

    // Transform state
    this.currentZoom = this.config.initialZoom;
    this.panX = 0;
    this.panY = 0;

    // Pan state
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.startPanX = 0;
    this.startPanY = 0;

    // Touch state
    this.lastTouchDistance = 0;
    this.touchStartZoom = 1;

    // Content group (what we transform)
    this.contentGroup = null;

    // Event handlers (bound to this instance)
    this.boundHandlers = {
      wheel: (e) => this.handleWheel(e),
      mouseDown: (e) => this.handleMouseDown(e),
      mouseMove: (e) => this.handleMouseMove(e),
      mouseUp: (e) => this.handleMouseUp(e),
      touchStart: (e) => this.handleTouchStart(e),
      touchMove: (e) => this.handleTouchMove(e),
      touchEnd: (e) => this.handleTouchEnd(e)
    };

    // Callbacks
    this.onTransformChange = null;
  }

  /**
   * Set the content group to transform
   * @param {SVGGElement} contentGroup - Content group element
   */
  setContentGroup(contentGroup) {
    this.contentGroup = contentGroup;
    this.updateTransform();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.svg) {
      return;
    }

    // Wheel zoom
    this.svg.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

    // Mouse pan
    this.svg.addEventListener('mousedown', this.boundHandlers.mouseDown);
    window.addEventListener('mousemove', this.boundHandlers.mouseMove);
    window.addEventListener('mouseup', this.boundHandlers.mouseUp);

    // Touch support
    this.svg.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    this.svg.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    this.svg.addEventListener('touchend', this.boundHandlers.touchEnd);
  }

  /**
   * Handle wheel event for zooming
   * @param {WheelEvent} event - Wheel event
   */
  handleWheel(event) {
    event.preventDefault();

    // Get cursor position relative to SVG
    const rect = this.svg.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;

    // Determine zoom direction
    const delta = event.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + (delta * this.config.zoomSpeed);

    // Zoom toward cursor
    this.zoom(zoomFactor, cursorX, cursorY);
  }

  /**
   * Handle mouse down for panning
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseDown(event) {
    // Only start pan on left click
    if (event.button !== 0) {
      return;
    }

    // Don't pan if clicking on a node
    if (event.target.closest('.tree-node')) {
      return;
    }

    this.isPanning = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startPanX = this.panX;
    this.startPanY = this.panY;

    this.svg.style.cursor = 'grabbing';
  }

  /**
   * Handle mouse move for panning
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseMove(event) {
    if (!this.isPanning) {
      return;
    }

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;

    this.panX = this.startPanX + dx;
    this.panY = this.startPanY + dy;

    this.updateTransform();
  }

  /**
   * Handle mouse up to end panning
   * @param {MouseEvent} event - Mouse event
   */
  handleMouseUp(event) {
    if (this.isPanning) {
      this.isPanning = false;
      this.svg.style.cursor = 'default';
    }
  }

  /**
   * Handle touch start
   * @param {TouchEvent} event - Touch event
   */
  handleTouchStart(event) {
    if (event.touches.length === 1) {
      // Single touch - pan
      event.preventDefault();
      this.isPanning = true;
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.startPanX = this.panX;
      this.startPanY = this.panY;
    } else if (event.touches.length === 2) {
      // Two touches - pinch zoom
      event.preventDefault();
      this.isPanning = false;

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      this.lastTouchDistance = this.getTouchDistance(touch1, touch2);
      this.touchStartZoom = this.currentZoom;
    }
  }

  /**
   * Handle touch move
   * @param {TouchEvent} event - Touch event
   */
  handleTouchMove(event) {
    if (event.touches.length === 1 && this.isPanning) {
      // Single touch pan
      event.preventDefault();

      const dx = event.touches[0].clientX - this.startX;
      const dy = event.touches[0].clientY - this.startY;

      this.panX = this.startPanX + dx;
      this.panY = this.startPanY + dy;

      this.updateTransform();
    } else if (event.touches.length === 2) {
      // Pinch zoom
      event.preventDefault();

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = this.getTouchDistance(touch1, touch2);

      if (this.lastTouchDistance > 0) {
        const zoomFactor = currentDistance / this.lastTouchDistance;

        // Get center point between touches
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;

        const rect = this.svg.getBoundingClientRect();
        const svgCenterX = centerX - rect.left;
        const svgCenterY = centerY - rect.top;

        this.zoom(zoomFactor, svgCenterX, svgCenterY);
      }

      this.lastTouchDistance = currentDistance;
    }
  }

  /**
   * Handle touch end
   * @param {TouchEvent} event - Touch event
   */
  handleTouchEnd(event) {
    if (event.touches.length < 2) {
      this.lastTouchDistance = 0;
    }

    if (event.touches.length === 0) {
      this.isPanning = false;
    }
  }

  /**
   * Calculate distance between two touch points
   * @param {Touch} touch1 - First touch
   * @param {Touch} touch2 - Second touch
   * @returns {number} Distance in pixels
   */
  getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Zoom by a factor toward a point
   * @param {number} factor - Zoom factor (>1 = zoom in, <1 = zoom out)
   * @param {number} centerX - X coordinate to zoom toward (in SVG space)
   * @param {number} centerY - Y coordinate to zoom toward (in SVG space)
   */
  zoom(factor, centerX, centerY) {
    const newZoom = this.currentZoom * factor;

    // Clamp zoom to min/max
    if (newZoom < this.config.minZoom || newZoom > this.config.maxZoom) {
      return;
    }

    // Calculate new pan to keep the point under cursor stationary
    const zoomRatio = newZoom / this.currentZoom;

    // Adjust pan to zoom toward the cursor position
    this.panX = centerX - (centerX - this.panX) * zoomRatio;
    this.panY = centerY - (centerY - this.panY) * zoomRatio;

    this.currentZoom = newZoom;

    this.updateTransform();
  }

  /**
   * Pan by a delta
   * @param {number} dx - Delta X
   * @param {number} dy - Delta Y
   */
  pan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.updateTransform();
  }

  /**
   * Fit the tree to the viewport
   * @param {Object} bounds - Tree bounds {minX, minY, maxX, maxY}
   * @param {number} padding - Padding around the tree
   */
  fitToView(bounds, padding = 50) {
    if (!bounds || !this.svg) {
      console.warn('⚠️ fitToView: missing bounds or svg');
      return;
    }

    const rect = this.svg.getBoundingClientRect();
    const svgWidth = rect.width;
    const svgHeight = rect.height;

    const treeWidth = bounds.maxX - bounds.minX;
    const treeHeight = bounds.maxY - bounds.minY;

    console.log('📐 fitToView input:', {
      bounds,
      svgWidth,
      svgHeight,
      treeWidth,
      treeHeight
    });

    // Calculate zoom to fit
    const scaleX = (svgWidth - padding * 2) / treeWidth;
    const scaleY = (svgHeight - padding * 2) / treeHeight;
    const newZoom = Math.min(scaleX, scaleY);

    // Clamp zoom
    this.currentZoom = Math.max(
      this.config.minZoom,
      Math.min(this.config.maxZoom, newZoom)
    );

    // Center the tree
    const scaledTreeWidth = treeWidth * this.currentZoom;
    const scaledTreeHeight = treeHeight * this.currentZoom;

    this.panX = (svgWidth - scaledTreeWidth) / 2 - (bounds.minX * this.currentZoom);
    this.panY = (svgHeight - scaledTreeHeight) / 2 - (bounds.minY * this.currentZoom);

    console.log('📐 fitToView result:', {
      zoom: this.currentZoom,
      panX: this.panX,
      panY: this.panY,
      scaledTreeWidth,
      scaledTreeHeight
    });

    this.updateTransform(true);
  }

  /**
   * Center the view on a specific point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  centerOn(x, y) {
    if (!this.svg) {
      return;
    }

    const rect = this.svg.getBoundingClientRect();
    const svgCenterX = rect.width / 2;
    const svgCenterY = rect.height / 2;

    this.panX = svgCenterX - (x * this.currentZoom);
    this.panY = svgCenterY - (y * this.currentZoom);

    this.updateTransform(true);
  }

  /**
   * Update the transform on the content group
   * @param {boolean} animated - Whether to animate the transition
   */
  updateTransform(animated = false) {
    if (!this.contentGroup) {
      return;
    }

    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;

    if (animated && this.config.smoothing) {
      this.contentGroup.style.transition = `transform ${this.config.transitionDuration}ms ease-out`;
    } else {
      this.contentGroup.style.transition = 'none';
    }

    this.contentGroup.style.transform = transform;

    // Notify listeners
    if (this.onTransformChange) {
      this.onTransformChange({
        zoom: this.currentZoom,
        panX: this.panX,
        panY: this.panY
      });
    }
  }

  /**
   * Reset to initial view
   */
  reset() {
    this.currentZoom = this.config.initialZoom;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform(true);
  }

  /**
   * Get current transform state
   * @returns {Object} Transform state
   */
  getTransform() {
    return {
      zoom: this.currentZoom,
      panX: this.panX,
      panY: this.panY
    };
  }

  /**
   * Set transform state
   * @param {Object} transform - Transform state
   * @param {boolean} animated - Whether to animate
   */
  setTransform(transform, animated = false) {
    if (transform.zoom !== undefined) {
      this.currentZoom = Math.max(
        this.config.minZoom,
        Math.min(this.config.maxZoom, transform.zoom)
      );
    }
    if (transform.panX !== undefined) {
      this.panX = transform.panX;
    }
    if (transform.panY !== undefined) {
      this.panY = transform.panY;
    }

    this.updateTransform(animated);
  }

  /**
   * Set the transform change callback
   * @param {Function} callback - Callback function
   */
  setTransformChangeCallback(callback) {
    this.onTransformChange = callback;
  }

  /**
   * Clean up event listeners and destroy
   */
  destroy() {
    if (!this.svg) {
      return;
    }

    // Remove event listeners
    this.svg.removeEventListener('wheel', this.boundHandlers.wheel);
    this.svg.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    window.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    window.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.svg.removeEventListener('touchstart', this.boundHandlers.touchStart);
    this.svg.removeEventListener('touchmove', this.boundHandlers.touchMove);
    this.svg.removeEventListener('touchend', this.boundHandlers.touchEnd);

    this.svg = null;
    this.contentGroup = null;
    this.onTransformChange = null;
  }
}

export default PanZoomController;
