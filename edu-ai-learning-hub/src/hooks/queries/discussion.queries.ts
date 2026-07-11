/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/queries/discussion.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  InfiniteData,
  useInfiniteQuery,
  QueryFunctionContext,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import {
  createDiscussionThread,
  getDiscussionThreads,
  updateDiscussionThread,
  deleteDiscussionThread,
  createDiscussionPost,
  getDiscussionPosts,
  updateDiscussionPost,
  deleteDiscussionPost,
  Thread,
  Post,
  ThreadListResponse,
  PostListResponse,
  ThreadQueryParams,
  PostQueryParams,
  CreateThreadData,
  UpdateThreadData,
  CreatePostData,
  UpdatePostData,
} from '@/services/discussion.service';

// Query Key Factory
export const discussionKeys = {
  all: ['discussions'] as const,
  threads: (params?: ThreadQueryParams) =>
    [...discussionKeys.all, 'threads', params || {}] as const,
  threadDetail: (id?: number) =>
    [...discussionKeys.all, 'threadDetail', id] as const, // Nếu có API lấy chi tiết thread
  posts: (params?: PostQueryParams) =>
    [...discussionKeys.all, 'posts', params || {}] as const,
  postDetail: (id?: number) =>
    [...discussionKeys.all, 'postDetail', id] as const, // Nếu có API lấy chi tiết post
};

// --- Thread Queries ---

/**
 * Hook lấy danh sách threads với infinite scrolling.
 * @param params - Omit 'page'.
 * @param options - React Query options cho useInfiniteQuery.
 */
export const useInfiniteDiscussionThreads = (
  params: Omit<ThreadQueryParams, 'page'>,
  options?: Omit<
    // Sửa ở đây: Type argument cho UseInfiniteQueryOptions
    UseInfiniteQueryOptions<
      ThreadListResponse, // TQueryFnData: Kiểu dữ liệu trả về của queryFn cho MỘT page
      Error, // TError
      InfiniteData<ThreadListResponse>, // TData: Kiểu dữ liệu của `data` (data.pages, data.pageParams)
      ThreadListResponse, // TQueryData: Kiểu dữ liệu của queryFn (giống TQueryFnData)
      ReadonlyArray<string | Record<string, any> | undefined>, // TQueryKey
      number | undefined // TPageParam: Kiểu của pageParam (ví dụ: số trang tiếp theo)
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam' // Các key đã được định nghĩa bên trong
  >
) => {
  const queryKey = discussionKeys.threads(params);
  const defaultLimit = params.limit || 5;

  return useInfiniteQuery<
    ThreadListResponse, // TQueryFnData
    Error, // TError
    InfiniteData<ThreadListResponse>, // TData
    ReadonlyArray<string | Record<string, any> | undefined>, // TQueryKey
    number | undefined // TPageParam
  >({
    queryKey: queryKey,
    queryFn: async ({
      pageParam = 1,
    }: QueryFunctionContext<
      ReadonlyArray<string | Record<string, any> | undefined>,
      number | undefined
    >) => {
      return getDiscussionThreads({
        ...params,
        page: pageParam,
        limit: defaultLimit,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!params.courseId || !!params.lessonId,
    staleTime: 1000 * 60 * 1,
    ...options,
  });
};

// --- Thread Mutations ---

/** Hook tạo thread */
export const useCreateDiscussionThread = (
  options?: UseMutationOptions<Thread, Error, CreateThreadData>
) => {
  const queryClient = useQueryClient();
  return useMutation<Thread, Error, CreateThreadData>({
    mutationFn: (data: CreateThreadData) =>
      createDiscussionThread(data.lessonId, data),
    onSuccess: (data) => {
      // Invalidate danh sách thread của course/lesson tương ứng
      queryClient.invalidateQueries({
        queryKey: discussionKeys.threads({ courseId: data.courseId }),
      });
      if (data.lessonId) {
        queryClient.invalidateQueries({
          queryKey: discussionKeys.threads({ lessonId: data.lessonId }),
        });
      }
      console.log('Discussion thread created.');
      // toast.success('Tạo chủ đề thành công!');
    },
    onError: (error) => {
      console.error('Create thread failed:', error.message);
      // toast.error(error.message || 'Tạo chủ đề thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật thread */
export const useUpdateDiscussionThread = (
  options?: UseMutationOptions<
    Thread,
    Error,
    { threadId: number; data: UpdateThreadData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Thread,
    Error,
    { threadId: number; data: UpdateThreadData }
  >({
    mutationFn: ({ threadId, data }) => updateDiscussionThread(threadId, data),
    onSuccess: (updatedThread) => {
      // Invalidate danh sách thread liên quan
      queryClient.invalidateQueries({
        queryKey: discussionKeys.threads({ courseId: updatedThread.courseId }),
      });
      if (updatedThread.lessonId) {
        queryClient.invalidateQueries({
          queryKey: discussionKeys.threads({
            lessonId: updatedThread.lessonId,
          }),
        });
      }
      // Có thể cập nhật cache chi tiết thread nếu có
      // queryClient.setQueryData(discussionKeys.threadDetail(updatedThread.ThreadID), updatedThread);
      console.log('Discussion thread updated.');
      // toast.success('Cập nhật chủ đề thành công!');
    },
    onError: (error) => {
      console.error('Update thread failed:', error.message);
      // toast.error(error.message || 'Cập nhật chủ đề thất bại.');
    },
    ...options,
  });
};

/** Hook xóa thread */
export const useDeleteDiscussionThread = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    // Input là threadId
    mutationFn: deleteDiscussionThread,
    onSuccess: (_, threadId) => {
      // Invalidate tất cả danh sách thread vì không dễ lấy courseId/lessonId
      queryClient.invalidateQueries({ queryKey: discussionKeys.threads() });
      // Xóa cache posts của thread này
      queryClient.removeQueries({
        queryKey: discussionKeys.posts({ threadId }),
      });
      console.log('Discussion thread deleted.');
      // toast.success('Xóa chủ đề thành công!');
    },
    onError: (error) => {
      console.error('Delete thread failed:', error.message);
      // toast.error(error.message || 'Xóa chủ đề thất bại.');
    },
    ...options,
  });
};

// --- Post Queries ---

/** Hook lấy danh sách posts của thread */
/**
 * Hook lấy danh sách posts của một thread với infinite scrolling.
 * @param params - Omit 'page'. Requires 'threadId'.
 * @param options - React Query options.
 */
export const useInfiniteDiscussionPosts = (
  params: Omit<PostQueryParams, 'page'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      PostListResponse,
      Error,
      InfiniteData<PostListResponse>,
      PostListResponse,
      ReadonlyArray<string | Record<string, any> | undefined>,
      number | undefined
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >
) => {
  const queryKey = discussionKeys.posts(params);
  const defaultLimit = params.limit || 10;

  return useInfiniteQuery<
    PostListResponse,
    Error,
    InfiniteData<PostListResponse>,
    ReadonlyArray<string | Record<string, any> | undefined>,
    number | undefined
  >({
    queryKey: queryKey,
    queryFn: async ({
      pageParam = 1,
    }: QueryFunctionContext<
      ReadonlyArray<string | Record<string, any> | undefined>,
      number | undefined
    >) => {
      return getDiscussionPosts(params.threadId, {
        ...params,
        page: pageParam,
        limit: defaultLimit,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!params.threadId,
    staleTime: 1000 * 30,
    ...options,
  });
};

// --- Post Mutations ---

/** Hook tạo post */
export const useCreateDiscussionPost = (
  options?: UseMutationOptions<
    Post,
    Error,
    { threadId: number; data: CreatePostData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<Post, Error, { threadId: number; data: CreatePostData }>({
    mutationFn: ({ threadId, data }) => createDiscussionPost(threadId, data),
    onSuccess: (data, variables) => {
      // Invalidate danh sách posts của thread đó
      queryClient.invalidateQueries({
        queryKey: discussionKeys.posts({ threadId: variables.threadId }),
      });
      // Invalidate danh sách threads để cập nhật PostCount và UpdatedAt
      queryClient.invalidateQueries({ queryKey: discussionKeys.threads() }); // Invalidate all threads
      console.log('Discussion post created.');
      // toast.success('Gửi trả lời thành công!');
    },
    onError: (error) => {
      console.error('Create post failed:', error.message);
      // toast.error(error.message || 'Gửi trả lời thất bại.');
    },
    ...options,
  });
};

/** Hook cập nhật post */
export const useUpdateDiscussionPost = (
  options?: UseMutationOptions<
    Post,
    Error,
    { postId: number; data: UpdatePostData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<Post, Error, { postId: number; data: UpdatePostData }>({
    mutationFn: ({ postId, data }) => updateDiscussionPost(postId, data),
    onSuccess: (updatedPost) => {
      // Invalidate danh sách posts của thread chứa post này
      queryClient.invalidateQueries({
        queryKey: discussionKeys.posts({ threadId: updatedPost.threadId }),
      });
      // Cập nhật cache chi tiết post nếu có
      console.log('Discussion post updated.');
      // toast.success('Cập nhật bài viết thành công!');
    },
    onError: (error) => {
      console.error('Update post failed:', error.message);
      // toast.error(error.message || 'Cập nhật bài viết thất bại.');
    },
    ...options,
  });
};

/** Hook xóa post */
export const useDeleteDiscussionPost = (
  options?: UseMutationOptions<
    void,
    Error,
    { postId: number; threadId?: number }
  >
) => {
  const queryClient = useQueryClient();
  // threadId optional, để invalidate cache
  return useMutation<void, Error, { postId: number; threadId?: number }>({
    mutationFn: ({ postId }) => deleteDiscussionPost(postId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: discussionKeys.posts({ threadId: variables.threadId }),
      });
      queryClient.invalidateQueries({ queryKey: discussionKeys.threads() }); // Invalidate threads để cập nhật count/time
      console.log('Discussion post deleted.');
      // toast.success('Xóa bài viết thành công!');
    },
    onError: (error) => {
      console.error('Delete post failed:', error.message);
      // toast.error(error.message || 'Xóa bài viết thất bại.');
    },
    ...options,
  });
};
