import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing async operations
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Whether to execute immediately on mount
 * @returns {Object} Async operation state and methods
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Execute the async function
   */
  const execute = useCallback(async (...params) => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction(...params);

      if (isMounted.current) {
        setData(response);
        setStatus('success');
      }

      return response;
    } catch (error) {
      if (isMounted.current) {
        setError(error);
        setStatus('error');
      }

      throw error;
    }
  }, [asyncFunction]);

  /**
   * Reset the async state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    reset,
    status,
    data,
    error,
    isIdle: status === 'idle',
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}

/**
 * Hook for managing async data fetching with automatic execution
 * @param {Function} asyncFunction - Async function to execute
 * @param {Array} dependencies - Dependencies that trigger re-fetch
 * @returns {Object} Fetch state and methods
 */
export function useFetch(asyncFunction, dependencies = []) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await asyncFunction();

      if (isMounted.current) {
        setData(response);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    data,
    error,
    refetch
  };
}

/**
 * Hook for debouncing async operations
 * @param {Function} asyncFunction - Async function to execute
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useAsyncDebounce(asyncFunction, delay = 500) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedExecute = useCallback((...params) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      setStatus('pending');
      setError(null);

      try {
        const response = await asyncFunction(...params);

        if (isMounted.current) {
          setData(response);
          setStatus('success');
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
          setStatus('error');
        }
      }
    }, delay);
  }, [asyncFunction, delay]);

  return {
    execute: debouncedExecute,
    status,
    data,
    error,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}

export default useAsync;
