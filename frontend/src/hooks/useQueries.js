/**
 * Custom React Query hooks for API data fetching
 * Provides cached, optimized API calls with automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../utils/axios';
import { queryKeys } from '../config/queryClient';

/**
 * Fetch all members
 */
export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members.list(),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/members`);
      return data;
    },
  });
}

/**
 * Fetch a single member by ID
 */
export function useMember(memberId) {
  return useQuery({
    queryKey: queryKeys.members.detail(memberId),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/members/${memberId}`);
      return data;
    },
    enabled: !!memberId, // Only run if memberId exists
  });
}

/**
 * Fetch tagged photos for a member
 */
export function useTaggedPhotos(memberId) {
  return useQuery({
    queryKey: queryKeys.members.tagged(memberId),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/albums/tagged/${memberId}`);
      return data || [];
    },
    enabled: !!memberId,
  });
}

/**
 * Fetch relationships for a member
 */
export function useMemberRelationships(memberId) {
  return useQuery({
    queryKey: queryKeys.relationships.member(memberId),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/relationships/member/${memberId}`);
      return data;
    },
    enabled: !!memberId,
  });
}

/**
 * Fetch all relationship types
 */
export function useRelationshipTypes() {
  return useQuery({
    queryKey: queryKeys.relationships.types(),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/relationships/types`);
      return data;
    },
    staleTime: 30 * 60 * 1000, // Relationship types rarely change
  });
}

/**
 * Fetch all albums
 */
export function useAlbums() {
  return useQuery({
    queryKey: queryKeys.albums.list(),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/albums`);
      return data;
    },
  });
}

/**
 * Fetch a single album by ID
 */
export function useAlbum(albumId) {
  return useQuery({
    queryKey: queryKeys.albums.detail(albumId),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/albums/${albumId}`);
      return data;
    },
    enabled: !!albumId,
  });
}

/**
 * Fetch all stories
 */
export function useStories() {
  return useQuery({
    queryKey: queryKeys.stories.list(),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/stories`);
      return data;
    },
  });
}

/**
 * Fetch a single story by ID
 */
export function useStory(storyId) {
  return useQuery({
    queryKey: queryKeys.stories.detail(storyId),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/stories/${storyId}`);
      return data;
    },
    enabled: !!storyId,
  });
}

/**
 * Fetch family tree data
 */
export function useTreeData() {
  return useQuery({
    queryKey: queryKeys.tree.data(),
    queryFn: async () => {
      const { data } = await axios.get(`${process.env.REACT_APP_API}/api/tree`);
      return data;
    },
    staleTime: 2 * 60 * 1000, // Tree data is fresh for 2 minutes
  });
}

/**
 * Create a new member (mutation)
 */
export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberData) => {
      const { data } = await axios.post(`${process.env.REACT_APP_API}/api/members`, memberData);
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tree.data() });
    },
  });
}

/**
 * Update a member (mutation)
 */
export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...memberData }) => {
      const { data } = await axios.put(`${process.env.REACT_APP_API}/api/members/${id}`, memberData);
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific member and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.members.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tree.data() });
    },
  });
}

/**
 * Delete a member (mutation)
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId) => {
      await axios.delete(`${process.env.REACT_APP_API}/api/members/${memberId}`);
    },
    onSuccess: () => {
      // Invalidate members list
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tree.data() });
    },
  });
}

/**
 * Create a relationship (mutation)
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relationshipData) => {
      const { data } = await axios.post(`${process.env.REACT_APP_API}/api/relationships`, relationshipData);
      return data;
    },
    onSuccess: () => {
      // Invalidate relationships
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tree.data() });
    },
  });
}

/**
 * Delete a relationship (mutation)
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relationshipId) => {
      await axios.delete(`${process.env.REACT_APP_API}/api/relationships/${relationshipId}`);
    },
    onSuccess: () => {
      // Invalidate relationships
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tree.data() });
    },
  });
}
