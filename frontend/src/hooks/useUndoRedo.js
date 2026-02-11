/**
 * useUndoRedo Hook
 *
 * Provides undo/redo functionality using useReducer pattern.
 * Maintains past, present, and future states for complete history tracking.
 *
 * Usage:
 *   const { state, setState, undo, redo, canUndo, canRedo, reset } = useUndoRedo(initialValue);
 */

import { useReducer, useCallback } from 'react';

const initialState = {
  past: [],
  present: null,
  future: []
};

function undoRedoReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [] // Clear future when new action is taken
      };

    case 'UNDO':
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future]
      };

    case 'REDO':
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1)
      };

    case 'RESET':
      return {
        ...initialState,
        present: action.payload
      };

    default:
      return state;
  }
}

export function useUndoRedo(initialValue) {
  const [state, dispatch] = useReducer(undoRedoReducer, {
    ...initialState,
    present: initialValue
  });

  const set = useCallback((value) => {
    dispatch({ type: 'SET', payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback((value) => {
    dispatch({ type: 'RESET', payload: value });
  }, []);

  return {
    state: state.present,
    setState: set,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset
  };
}
