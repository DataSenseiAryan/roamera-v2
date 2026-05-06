import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  AddBucketListInput,
  BucketListItem,
  Comment,
  CreateCommentInput,
  CreatePostInput,
  Destination,
  Post,
  ReactionInput,
  UpdatePostInput,
} from '@roamera/types';

import { getApiClient } from '../client';

export const postKeys = {
  feed: (feed: string) => ['feed', feed] as const,
  post: (id: string) => ['posts', id] as const,
  userPosts: (userId: string) => ['users', userId, 'posts'] as const,
  comments: (postId: string) => ['posts', postId, 'comments'] as const,
  reactions: (postId: string) => ['posts', postId, 'reactions'] as const,
  saved: () => ['feed', 'saved'] as const,
  bucketList: () => ['feed', 'bucket-list'] as const,
  destinations: () => ['feed', 'destinations'] as const,
  destination: (id: string) => ['feed', 'destinations', id] as const,
  trending: () => ['feed', 'trending'] as const,
  search: (q: string) => ['feed', 'search', q] as const,
};

// ─── Feed ──────────────────────────────────────────────────────────

interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useFeedQuery(feed: 'global' | 'following' = 'global') {
  return useInfiniteQuery<FeedPage>({
    queryKey: postKeys.feed(feed),
    queryFn: async ({ pageParam }): Promise<FeedPage> => {
      const params: Record<string, string> = { feed, limit: '20' };
      if (pageParam) params.cursor = pageParam as string;
      const { data } = await getApiClient().get('/api/v1/feed/compass', { params });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: 60_000,
  });
}

// ─── User Posts ────────────────────────────────────────────────────

interface UserPostsPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useUserPostsQuery(userId: string) {
  return useInfiniteQuery<UserPostsPage>({
    queryKey: postKeys.userPosts(userId),
    queryFn: async ({ pageParam }): Promise<UserPostsPage> => {
      const params: Record<string, string> = { limit: '20' };
      if (pageParam) params.cursor = pageParam as string;
      const { data } = await getApiClient().get(`/api/v1/users/${userId}/posts`, { params });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

// ─── Single Post ───────────────────────────────────────────────────

export function usePostQuery(postId: string) {
  return useQuery({
    queryKey: postKeys.post(postId),
    queryFn: async (): Promise<Post> => {
      const { data } = await getApiClient().get(`/api/v1/posts/${postId}`);
      return data.post;
    },
    enabled: !!postId,
  });
}

// ─── Create / Update / Delete Post ─────────────────────────────────

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePostInput): Promise<Post> => {
      const { data } = await getApiClient().post('/api/v1/posts', input);
      return data.post;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUpdatePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePostInput): Promise<Post> => {
      const { data } = await getApiClient().patch(`/api/v1/posts/${postId}`, input);
      return data.post;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(postKeys.post(postId), post);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await getApiClient().delete(`/api/v1/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Photo Upload ──────────────────────────────────────────────────

export function useUploadPhotos(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]): Promise<Post> => {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f));
      const { data } = await getApiClient().post(
        `/api/v1/posts/${postId}/photos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data.post;
    },
    onSuccess: (post) => {
      queryClient.setQueryData(postKeys.post(postId), post);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Reactions ─────────────────────────────────────────────────────

export function useReact(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReactionInput) => {
      const { data } = await getApiClient().post(
        `/api/v1/posts/${postId}/reactions`,
        input,
      );
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: postKeys.post(postId) });
      const prev = queryClient.getQueryData<Post>(postKeys.post(postId));
      if (prev) {
        const isToggleOff = prev.viewerReaction === input.type;
        queryClient.setQueryData<Post>(postKeys.post(postId), {
          ...prev,
          viewerReaction: isToggleOff ? null : input.type,
          likesCount: prev.likesCount + (isToggleOff ? -1 : prev.viewerReaction ? 0 : 1),
          reactionCounts: {
            ...prev.reactionCounts,
            [input.type]: (prev.reactionCounts[input.type] ?? 0) + (isToggleOff ? -1 : 1),
            ...(prev.viewerReaction && prev.viewerReaction !== input.type
              ? { [prev.viewerReaction]: Math.max(0, (prev.reactionCounts[prev.viewerReaction] ?? 1) - 1) }
              : {}),
          },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(postKeys.post(postId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteReaction(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await getApiClient().delete(`/api/v1/posts/${postId}/reactions`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Comments ──────────────────────────────────────────────────────

interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useCommentsQuery(postId: string) {
  return useInfiniteQuery<CommentsPage>({
    queryKey: postKeys.comments(postId),
    queryFn: async ({ pageParam }): Promise<CommentsPage> => {
      const params: Record<string, string> = { limit: '30' };
      if (pageParam) params.cursor = pageParam as string;
      const { data } = await getApiClient().get(
        `/api/v1/posts/${postId}/comments`,
        { params },
      );
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<Comment> => {
      const { data } = await getApiClient().post(
        `/api/v1/posts/${postId}/comments`,
        input,
      );
      return data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }): Promise<Comment> => {
      const { data } = await getApiClient().patch(
        `/api/v1/posts/${postId}/comments/${commentId}`,
        { content },
      );
      return data.comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await getApiClient().delete(`/api/v1/posts/${postId}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

// ─── Save / Unsave ─────────────────────────────────────────────────

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await getApiClient().post(`/api/v1/posts/${postId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: postKeys.saved() });
    },
  });
}

export function useUnsavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      await getApiClient().delete(`/api/v1/posts/${postId}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: postKeys.saved() });
    },
  });
}

// ─── Destinations ──────────────────────────────────────────────────

export function useDestinationsQuery(params?: { category?: string; country?: string }) {
  return useQuery({
    queryKey: [...postKeys.destinations(), params],
    queryFn: async (): Promise<Destination[]> => {
      const { data } = await getApiClient().get('/api/v1/feed/destinations', { params });
      return data.destinations;
    },
  });
}

export function useDestinationQuery(id: string) {
  return useQuery({
    queryKey: postKeys.destination(id),
    queryFn: async (): Promise<{ destination: Destination; recentPosts: Post[] }> => {
      const { data } = await getApiClient().get(`/api/v1/feed/destinations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ─── Saved Posts ───────────────────────────────────────────────────

export function useSavedPostsQuery() {
  return useQuery({
    queryKey: postKeys.saved(),
    queryFn: async (): Promise<Post[]> => {
      const { data } = await getApiClient().get('/api/v1/feed/saved');
      return data.posts;
    },
  });
}

// ─── Bucket List ───────────────────────────────────────────────────

export function useBucketListQuery() {
  return useQuery({
    queryKey: postKeys.bucketList(),
    queryFn: async (): Promise<BucketListItem[]> => {
      const { data } = await getApiClient().get('/api/v1/feed/bucket-list');
      return data.items;
    },
  });
}

export function useAddBucketList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddBucketListInput): Promise<BucketListItem> => {
      const { data } = await getApiClient().post('/api/v1/feed/bucket-list', input);
      return data.item;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.bucketList() });
    },
  });
}

export function useDeleteBucketList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getApiClient().delete(`/api/v1/feed/bucket-list/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.bucketList() });
    },
  });
}

// ─── Trending & Search ─────────────────────────────────────────────

export function useTrendingQuery() {
  return useQuery({
    queryKey: postKeys.trending(),
    queryFn: async () => {
      const { data } = await getApiClient().get('/api/v1/feed/trending');
      return data as { destinations: Destination[]; hashtags: Array<{ tag: string; count: number }> };
    },
    staleTime: 5 * 60_000,
  });
}

export function useSearchQuery(q: string) {
  return useQuery({
    queryKey: postKeys.search(q),
    queryFn: async () => {
      const { data } = await getApiClient().get('/api/v1/feed/search', { params: { q } });
      return data as { posts: Post[]; users: Array<{ id: string; username: string; avatarUrl: string | null }>; destinations: Destination[] };
    },
    enabled: q.length >= 2,
  });
}
