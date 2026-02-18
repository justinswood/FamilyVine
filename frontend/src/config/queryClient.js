/**
 * React Query Configuration
 * Provides centralized caching and data fetching configuration
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query options
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache persists for 30 minutes
      refetchOnWindowFocus: false, // Trust staleTime instead of refetching on focus
      refetchOnReconnect: true, // Refetch when internet connection is restored
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      // Global mutation options
      retry: 0, // Don't retry mutations
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Members
  members: {
    all: ['members'],
    list: () => [...queryKeys.members.all, 'list'],
    detail: (id) => [...queryKeys.members.all, 'detail', id],
    tagged: (id) => [...queryKeys.members.all, 'tagged', id],
  },
  // Relationships
  relationships: {
    all: ['relationships'],
    list: () => [...queryKeys.relationships.all, 'list'],
    member: (memberId) => [...queryKeys.relationships.all, 'member', memberId],
    types: () => [...queryKeys.relationships.all, 'types'],
  },
  // Albums
  albums: {
    all: ['albums'],
    list: () => [...queryKeys.albums.all, 'list'],
    detail: (id) => [...queryKeys.albums.all, 'detail', id],
  },
  // Stories
  stories: {
    all: ['stories'],
    list: () => [...queryKeys.stories.all, 'list'],
    detail: (id) => [...queryKeys.stories.all, 'detail', id],
  },
  // Recipes
  recipes: {
    all: ['recipes'],
    list: () => [...queryKeys.recipes.all, 'list'],
    detail: (id) => [...queryKeys.recipes.all, 'detail', id],
  },
  // Auth
  auth: {
    user: () => ['auth', 'user'],
  },
  // Tree
  tree: {
    data: () => ['tree', 'data'],
    positions: () => ['tree', 'positions'],
  },
  // User preferences
  preferences: {
    all: ['preferences'],
    current: () => ['preferences', 'current'],
  },
};

export default queryClient;
