/**
 * FamilyTreeView - React component wrapper for FamilyTree
 * Provides a React-friendly interface to the core library
 */

import React, { useRef, useEffect, useState } from 'react';
import { FamilyTree } from '../core/FamilyTree.js';
import '../styles/family-tree.css';

const FamilyTreeView = ({
  data,                    // Generations data from backend API
  apiUrl,                  // Base API URL for images (e.g., 'http://localhost:5050')
  maxGenerations = 4,      // How many generations to show
  onNodeClick,             // Callback: (memberId) => void
  showMiniMap = true,      // Show mini-map navigation
  config = {},             // Override layout config
  className = '',
  style = {},
  onDataLoaded,            // Callback when data is loaded: (stats) => void
  onError                  // Callback when error occurs: (error) => void
}) => {
  const containerRef = useRef(null);
  const miniMapRef = useRef(null);
  const treeInstanceRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize tree on mount
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    try {
      console.log('🌳 Initializing FamilyTreeView');

      // Create tree instance
      treeInstanceRef.current = new FamilyTree(containerRef.current, {
        ...config,
        apiUrl: apiUrl || '',
        miniMapContainer: showMiniMap ? miniMapRef.current : null,
        onNodeClick: onNodeClick || null
      });

      // Subscribe to events
      if (onDataLoaded) {
        treeInstanceRef.current.on('dataLoaded', onDataLoaded);
      }

      setIsInitialized(true);
      console.log('✅ FamilyTreeView initialized');
    } catch (error) {
      console.error('Error initializing FamilyTree:', error);
      if (onError) {
        onError(error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (treeInstanceRef.current) {
        treeInstanceRef.current.destroy();
        treeInstanceRef.current = null;
      }
      setIsInitialized(false);
    };
  }, []); // Only run on mount/unmount

  // Update data when it changes
  useEffect(() => {
    if (!isInitialized || !treeInstanceRef.current || !data) {
      return;
    }

    try {
      console.log('📊 Updating tree data');
      treeInstanceRef.current.setData(data, maxGenerations);
    } catch (error) {
      console.error('Error setting tree data:', error);
      if (onError) {
        onError(error);
      }
    }
  }, [data, maxGenerations, isInitialized, onError]);

  // Update node click handler when it changes
  useEffect(() => {
    if (!isInitialized || !treeInstanceRef.current) {
      return;
    }

    if (onNodeClick) {
      treeInstanceRef.current.setNodeClickHandler(onNodeClick);
    }
  }, [onNodeClick, isInitialized]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current || !isInitialized || !treeInstanceRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (treeInstanceRef.current) {
        // Debounce resize events
        clearTimeout(resizeObserver.timeout);
        resizeObserver.timeout = setTimeout(() => {
          treeInstanceRef.current.handleResize();
        }, 150);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(resizeObserver.timeout);
      resizeObserver.disconnect();
    };
  }, [isInitialized]);

  return (
    <div
      className={`fv-tree-wrapper ${className}`}
      style={style}
    >
      <div
        ref={containerRef}
        className="fv-tree-container"
        style={{ width: '100%', height: '100%' }}
      />
      {showMiniMap && (
        <div
          ref={miniMapRef}
          className="fv-tree-minimap"
        />
      )}
    </div>
  );
};

export default FamilyTreeView;
