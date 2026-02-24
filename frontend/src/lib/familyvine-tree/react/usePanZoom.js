/**
 * usePanZoom - Custom hook wrapping PanZoomController with React refs
 *
 * Uses a wrapper-div CSS transform approach:
 *   viewportRef  → fixed outer container (receives events, clips overflow)
 *   transformRef → inner div that receives CSS transform: translate() scale()
 *   svgRef       → the SVG element (kept for dimension queries)
 *   contentGroupRef → the <g> element (kept for compatibility)
 */

import { useRef, useEffect, useCallback } from 'react';
import { PanZoomController } from '../core/interaction/PanZoomController.js';
import LayoutConfig from '../core/layout/LayoutConfig.js';

/**
 * Hook: attach PanZoomController to viewport + transform target refs.
 * Pan/zoom is handled via direct DOM manipulation (no React re-renders).
 * @param {Object} config - Optional PanZoomController config overrides
 */
export function usePanZoom(config = {}) {
  const viewportRef = useRef(null);
  const transformRef = useRef(null);
  const svgRef = useRef(null);
  const contentGroupRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!viewportRef.current || !transformRef.current) return;

    const mergedConfig = {
      minZoom: LayoutConfig.ZOOM_MIN,
      maxZoom: LayoutConfig.ZOOM_MAX,
      initialZoom: LayoutConfig.ZOOM_INITIAL,
      transitionDuration: LayoutConfig.TRANSITION_DURATION,
      ...config,
    };

    const controller = new PanZoomController(viewportRef.current, mergedConfig);
    controller.setTransformTarget(transformRef.current);
    controller.setupEventListeners();
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []); // Mount/unmount only - controller is a singleton per viewport

  const fitToView = useCallback((bounds, padding = 50) => {
    controllerRef.current?.fitToView(bounds, padding);
  }, []);

  const centerOn = useCallback((x, y) => {
    controllerRef.current?.centerOn(x, y);
  }, []);

  const getTransform = useCallback(() => {
    return controllerRef.current?.getTransform() ?? { zoom: 1, panX: 0, panY: 0 };
  }, []);

  const setTransformChangeCallback = useCallback((cb) => {
    if (controllerRef.current) {
      controllerRef.current.setTransformChangeCallback(cb);
    }
  }, []);

  return {
    viewportRef,
    transformRef,
    svgRef,
    contentGroupRef,
    controllerRef,
    fitToView,
    centerOn,
    getTransform,
    setTransformChangeCallback,
  };
}

export default usePanZoom;
