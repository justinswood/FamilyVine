/**
 * usePanZoom - Custom hook wrapping PanZoomController with React refs
 */

import { useRef, useEffect, useCallback } from 'react';
import { PanZoomController } from '../core/interaction/PanZoomController.js';
import LayoutConfig from '../core/layout/LayoutConfig.js';

/**
 * Hook: attach PanZoomController to SVG + content group refs.
 * Pan/zoom is handled via direct DOM manipulation (no React re-renders).
 * @param {Object} config - Optional PanZoomController config overrides
 */
export function usePanZoom(config = {}) {
  const svgRef = useRef(null);
  const contentGroupRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !contentGroupRef.current) return;

    const mergedConfig = {
      minZoom: LayoutConfig.ZOOM_MIN,
      maxZoom: LayoutConfig.ZOOM_MAX,
      initialZoom: LayoutConfig.ZOOM_INITIAL,
      transitionDuration: LayoutConfig.TRANSITION_DURATION,
      ...config,
    };

    const controller = new PanZoomController(svgRef.current, mergedConfig);
    controller.setContentGroup(contentGroupRef.current);
    controller.setupEventListeners();
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []); // Mount/unmount only - controller is a singleton per SVG

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
