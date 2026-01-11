/**
 * useFamilyTree - Custom hook for family tree state management
 * Provides state and handlers for tree interaction
 */

import { useState, useCallback } from 'react';

export const useFamilyTree = (initialMaxGen = 4) => {
  const [maxGenerations, setMaxGenerations] = useState(initialMaxGen);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [treeStats, setTreeStats] = useState(null);

  /**
   * Handle node click - can be customized by parent component
   * @param {number|string} memberId - Member ID that was clicked
   */
  const handleNodeClick = useCallback((memberId) => {
    // Return memberId for parent to handle navigation
    // Parent can override this with their own handler
    return memberId;
  }, []);

  /**
   * Handle data loaded event
   * @param {Object} stats - Tree statistics {nodeCount, maxGeneration}
   */
  const handleDataLoaded = useCallback((stats) => {
    setTreeStats(stats);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Handle error
   * @param {Error|string} err - Error object or message
   */
  const handleError = useCallback((err) => {
    setError(err.message || err);
    setIsLoading(false);
  }, []);

  /**
   * Reset tree state
   */
  const reset = useCallback(() => {
    setMaxGenerations(initialMaxGen);
    setIsLoading(false);
    setError(null);
    setTreeStats(null);
  }, [initialMaxGen]);

  return {
    maxGenerations,
    setMaxGenerations,
    isLoading,
    setIsLoading,
    error,
    setError,
    treeStats,
    handleNodeClick,
    handleDataLoaded,
    handleError,
    reset
  };
};

export default useFamilyTree;
