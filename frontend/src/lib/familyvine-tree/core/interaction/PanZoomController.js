/**
 * PanZoomController - Handles pan and zoom interactions
 *
 * Uses CSS transform on a wrapper HTML <div> that contains the SVG.
 * This avoids all known mobile WebKit bugs with SVG viewBox, SVG transform
 * attributes, and CSS transforms on <g> / <foreignObject> elements.
 *
 * The wrapper div receives:
 *   transform: translate(panXpx, panYpx) scale(zoom)
 *   transform-origin: 0 0
 *
 * The SVG inside uses overflow: visible and natural coordinate space.
 *
 * Internal state:
 *   screenX = treeX * zoom + panX
 *   screenY = treeY * zoom + panY
 */

import { LayoutConfig } from '../layout/LayoutConfig.js';

export class PanZoomController {
  constructor(viewport, config = {}) {
    this.viewport = viewport; // Fixed HTML container for events + clipping
    this.transformTarget = null; // HTML div to apply CSS transform to
    this.config = {
      minZoom: config.minZoom || LayoutConfig.ZOOM_MIN,
      maxZoom: config.maxZoom || LayoutConfig.ZOOM_MAX,
      initialZoom: config.initialZoom || LayoutConfig.ZOOM_INITIAL,
      zoomSpeed: config.zoomSpeed || 0.1,
      smoothing: config.smoothing !== false,
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

    // Cached viewport pixel dimensions (updated on resize)
    this._vpWidth = 0;
    this._vpHeight = 0;

    // Animation state
    this._animFrame = null;

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
   * Cache viewport element pixel dimensions
   */
  _cacheViewportDimensions() {
    if (!this.viewport) return;
    const rect = this.viewport.getBoundingClientRect();
    this._vpWidth = rect.width;
    this._vpHeight = rect.height;
  }

  /**
   * Set the HTML div that receives CSS transform.
   */
  setTransformTarget(el) {
    this.transformTarget = el;
    if (el) {
      el.style.transformOrigin = '0 0';
    }
    this._cacheViewportDimensions();
    this.updateTransform();
  }

  /**
   * Setup event listeners on the viewport element.
   */
  setupEventListeners() {
    if (!this.viewport) return;

    // Wheel zoom
    this.viewport.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

    // Mouse pan
    this.viewport.addEventListener('mousedown', this.boundHandlers.mouseDown);
    window.addEventListener('mousemove', this.boundHandlers.mouseMove);
    window.addEventListener('mouseup', this.boundHandlers.mouseUp);

    // Touch support
    this.viewport.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: false });
    this.viewport.addEventListener('touchmove', this.boundHandlers.touchMove, { passive: false });
    this.viewport.addEventListener('touchend', this.boundHandlers.touchEnd);

    // Window resize — update cached dimensions + re-fit
    this.boundHandlers.resize = () => {
      this._cacheViewportDimensions();
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._cacheViewportDimensions();
        if (this._lastBounds && !this.isPanning) {
          this.fitToView(this._lastBounds, this._lastPadding || 50);
        }
      }, 250);
    };
    window.addEventListener('resize', this.boundHandlers.resize);
  }

  // ── Mouse / wheel handlers ──────────────────────────────────────

  handleWheel(event) {
    event.preventDefault();
    const rect = this.viewport.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const delta = event.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1 + (delta * this.config.zoomSpeed);
    this.zoom(zoomFactor, cursorX, cursorY);
  }

  handleMouseDown(event) {
    if (event.button !== 0) return;
    if (event.target.closest('.person-card') || event.target.closest('.subtree-toggle')) return;

    this.isPanning = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
    this.viewport.style.cursor = 'grabbing';
  }

  handleMouseMove(event) {
    if (!this.isPanning) return;
    this.panX = this.startPanX + (event.clientX - this.startX);
    this.panY = this.startPanY + (event.clientY - this.startY);
    this.updateTransform();
  }

  handleMouseUp() {
    if (this.isPanning) {
      this.isPanning = false;
      this.viewport.style.cursor = '';
    }
  }

  // ── Touch handlers ──────────────────────────────────────────────

  handleTouchStart(event) {
    if (event.touches.length === 1) {
      if (event.target.closest('.person-card') || event.target.closest('.subtree-toggle')) return;
      event.preventDefault();
      this.isPanning = true;
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.startPanX = this.panX;
      this.startPanY = this.panY;
    } else if (event.touches.length === 2) {
      event.preventDefault();
      this.isPanning = false;
      this.lastTouchDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
      this.touchStartZoom = this.currentZoom;
    }
  }

  handleTouchMove(event) {
    if (event.touches.length === 1 && this.isPanning) {
      event.preventDefault();
      this.panX = this.startPanX + (event.touches[0].clientX - this.startX);
      this.panY = this.startPanY + (event.touches[0].clientY - this.startY);
      this.updateTransform();
    } else if (event.touches.length === 2) {
      event.preventDefault();
      const currentDistance = this.getTouchDistance(event.touches[0], event.touches[1]);

      if (this.lastTouchDistance > 0) {
        const zoomFactor = currentDistance / this.lastTouchDistance;
        const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        const rect = this.viewport.getBoundingClientRect();
        this.zoom(zoomFactor, centerX - rect.left, centerY - rect.top);
      }

      this.lastTouchDistance = currentDistance;
    }
  }

  handleTouchEnd(event) {
    if (event.touches.length < 2) this.lastTouchDistance = 0;
    if (event.touches.length === 0) this.isPanning = false;
  }

  getTouchDistance(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Zoom / pan ──────────────────────────────────────────────────

  zoom(factor, centerX, centerY) {
    const newZoom = this.currentZoom * factor;
    if (newZoom < this.config.minZoom || newZoom > this.config.maxZoom) return;

    const zoomRatio = newZoom / this.currentZoom;
    this.panX = centerX - (centerX - this.panX) * zoomRatio;
    this.panY = centerY - (centerY - this.panY) * zoomRatio;
    this.currentZoom = newZoom;

    this.updateTransform();
  }

  pan(dx, dy) {
    this.panX += dx;
    this.panY += dy;
    this.updateTransform();
  }

  // ── Fit-to-view / center ────────────────────────────────────────

  fitToView(bounds, padding = 50) {
    if (!bounds || !this.viewport) return;
    this._lastBounds = bounds;
    this._lastPadding = padding;
    this._cacheViewportDimensions();

    const vpWidth = this._vpWidth;
    const vpHeight = this._vpHeight;
    if (vpWidth === 0 || vpHeight === 0) return;

    const treeWidth = bounds.maxX - bounds.minX;
    const treeHeight = bounds.maxY - bounds.minY;

    const scaleX = (vpWidth - padding * 2) / treeWidth;
    const scaleY = (vpHeight - padding * 2) / treeHeight;
    const newZoom = Math.min(scaleX, scaleY);

    const fitMinZoom = LayoutConfig.FIT_MIN_ZOOM || this.config.minZoom;
    this.currentZoom = Math.max(fitMinZoom, Math.min(this.config.maxZoom, newZoom));

    const scaledTreeWidth = treeWidth * this.currentZoom;
    const scaledTreeHeight = treeHeight * this.currentZoom;

    this.panX = (vpWidth - scaledTreeWidth) / 2 - (bounds.minX * this.currentZoom);
    this.panY = (vpHeight - scaledTreeHeight) / 2 - (bounds.minY * this.currentZoom);

    this.updateTransform(true);
  }

  centerOn(x, y) {
    if (!this.viewport) return;
    this._cacheViewportDimensions();
    this.panX = this._vpWidth / 2 - (x * this.currentZoom);
    this.panY = this._vpHeight / 2 - (y * this.currentZoom);
    this.updateTransform(true);
  }

  // ── Core: apply CSS transform on wrapper div ──────────────────

  updateTransform(animated = false) {
    if (!this.transformTarget) return;

    if (animated && this.config.smoothing) {
      this._animateTransform();
    } else {
      if (this._animFrame) {
        cancelAnimationFrame(this._animFrame);
        this._animFrame = null;
      }
      this.transformTarget.style.transform =
        `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
    }

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
   * Animate CSS transform using requestAnimationFrame (ease-out cubic).
   */
  _animateTransform() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame);

    // Parse current CSS transform to get start values
    let startPanX = 0, startPanY = 0, startZoom = 1;
    const current = this.transformTarget.style.transform;
    if (current) {
      const translateMatch = current.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      const scaleMatch = current.match(/scale\(([-\d.]+)\)/);
      if (translateMatch && scaleMatch) {
        startPanX = parseFloat(translateMatch[1]);
        startPanY = parseFloat(translateMatch[2]);
        startZoom = parseFloat(scaleMatch[1]);
      }
    }

    const targetPanX = this.panX;
    const targetPanY = this.panY;
    const targetZoom = this.currentZoom;

    const duration = this.config.transitionDuration;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

      const px = startPanX + (targetPanX - startPanX) * ease;
      const py = startPanY + (targetPanY - startPanY) * ease;
      const z = startZoom + (targetZoom - startZoom) * ease;

      this.transformTarget.style.transform =
        `translate(${px}px, ${py}px) scale(${z})`;

      if (t < 1) {
        this._animFrame = requestAnimationFrame(step);
      } else {
        this._animFrame = null;
      }
    };

    this._animFrame = requestAnimationFrame(step);
  }

  // ── Utility ─────────────────────────────────────────────────────

  reset() {
    this.currentZoom = this.config.initialZoom;
    this.panX = 0;
    this.panY = 0;
    this.updateTransform(true);
  }

  getTransform() {
    return { zoom: this.currentZoom, panX: this.panX, panY: this.panY };
  }

  setTransform(transform, animated = false) {
    if (transform.zoom !== undefined) {
      this.currentZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, transform.zoom));
    }
    if (transform.panX !== undefined) this.panX = transform.panX;
    if (transform.panY !== undefined) this.panY = transform.panY;
    this.updateTransform(animated);
  }

  setTransformChangeCallback(callback) {
    this.onTransformChange = callback;
  }

  destroy() {
    if (!this.viewport) return;

    this.viewport.removeEventListener('wheel', this.boundHandlers.wheel);
    this.viewport.removeEventListener('mousedown', this.boundHandlers.mouseDown);
    window.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    window.removeEventListener('mouseup', this.boundHandlers.mouseUp);
    this.viewport.removeEventListener('touchstart', this.boundHandlers.touchStart);
    this.viewport.removeEventListener('touchmove', this.boundHandlers.touchMove);
    this.viewport.removeEventListener('touchend', this.boundHandlers.touchEnd);
    if (this.boundHandlers.resize) window.removeEventListener('resize', this.boundHandlers.resize);
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    if (this._animFrame) cancelAnimationFrame(this._animFrame);

    if (this.transformTarget) {
      this.transformTarget.style.transform = '';
    }

    this.viewport = null;
    this.transformTarget = null;
    this.onTransformChange = null;
  }
}

export default PanZoomController;
