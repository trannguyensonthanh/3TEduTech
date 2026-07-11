// src/services/discussion.service.ts
import apiHelper from './apiHelper';

export interface Thread {
  threadId: number;
  courseId: number;
  courseName?: string;
  courseSlug?: string;
  lessonName?: string;
  lessonId?: number | null;
  title: string;
  createdByAccountId: number;
  createdAt: string; // ISO Date string
  updatedAt: string; // Thời gian post cuối cùng hoặc thời gian tạo thread
  // Thông tin join
  creatorFullName?: string;
  creatorAvatar?: string | null;
  postCount?: number;
}

export interface Post {
  postId: number;
  threadId: number;
  parentPostId?: number | null;
  accountId: number;
  postText: string;
  isInstructorPost: boolean;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  // Thông tin join
  authorFullName?: string;
  authorAvatar?: string | null;
}

export interface ThreadListResponse {
  threads: Thread[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ThreadQueryParams {
  courseId?: number;
  lessonId?: number;
  page?: number;
  limit?: number;
  sortBy?: string; // 'CreatedAt:desc', 'UpdatedAt:desc'
}

export interface PostQueryParams {
  threadId: number; // Required when getting posts
  page?: number;
  limit?: number;
}

export interface CreateThreadData {
  courseId?: number;
  lessonId?: number;
  title: string;
}

export interface UpdateThreadData {
  title: string;
}

export interface CreatePostData {
  // threadId lấy từ URL
  text: string;
  parentPostId?: number;
}

export interface UpdatePostData {
  text: string;
}

// --- Thread APIs ---

// /** Tạo thread mới cho một Course */
// export const createCourseDiscussionThread = async (
//   courseId: number,
//   data: CreateThreadData
// ): Promise<Thread> => {
//   return apiHelper.post(`/courses/${courseId}/discussions`, data);
// };

/** Tạo thread mới cho một Lesson */
export const createDiscussionThread = async (
  lessonId: number, // Backend routes đang dùng lessonId trực tiếp
  data: CreateThreadData
): Promise<Thread> => {
  // Frontend cần biết courseId để điền vào CreateThreadForCoursePayload nếu API backend yêu cầu
  // Tuy nhiên, dựa trên routes.js backend, /lessons/:lessonId/discussions -> discussionController.createThread
  // Controller này sẽ lấy courseId từ lessonId (nếu cần) hoặc service createThread cần cả lessonId và courseId
  // Giả sử service createThread của backend có thể suy ra courseId từ lessonId hoặc FE gửi cả hai
  return apiHelper.post(`/lessons/${lessonId}/discussions`, data);
};

// /** Lấy danh sách threads của một Course */
// export const getCourseDiscussionThreads = async (
//   courseId: number,
//   params?: ThreadQueryParams // Chỉ còn page, limit, sortBy
// ): Promise<ThreadListResponse> => {
//   return apiHelper.get(`/courses/${courseId}/discussions`, undefined, params);
// };

/** Lấy danh sách threads của một Lesson */
export const getDiscussionThreads = async (params: {
  page: number;
  limit: number;
  lessonId?: number;
  courseId?: number;
  sortBy?: string;
}): Promise<ThreadListResponse> => {
  return apiHelper.get(
    `/lessons/${Number(params.lessonId)}/discussions`,
    undefined,
    params
  );
};

/** Cập nhật tiêu đề thread (dùng ThreadID) */
export const updateDiscussionThread = async (
  threadId: number,
  data: UpdateThreadData
): Promise<Thread> => {
  return apiHelper.patch(`/discussions/threads/${Number(threadId)}`, data);
};

/** Xóa thread (dùng ThreadID) */
export const deleteDiscussionThread = async (
  threadId: number
): Promise<void> => {
  await apiHelper.delete(`/discussions/threads/${Number(threadId)}`);
};

// --- Post APIs ---

/** Tạo post mới trong một Thread */
export const createDiscussionPost = async (
  threadId: number,
  data: CreatePostData
): Promise<Post> => {
  console.log('getDiscussionPosts', threadId);
  return apiHelper.post(`/discussions/threads/${Number(threadId)}/posts`, data);
};

/** Lấy danh sách posts của một Thread */
export const getDiscussionPosts = async (
  // Đổi tên hàm cho rõ
  threadId: number,
  params?: PostQueryParams
): Promise<PostListResponse> => {
  // Bỏ threadId khỏi params vì đã có trong URL

  const { page, limit } = params || {};
  return apiHelper.get(
    `/discussions/threads/${Number(threadId)}/posts`,
    undefined,
    {
      page,
      limit,
    }
  );
};

/** Cập nhật post (dùng PostID) */
export const updateDiscussionPost = async (
  postId: number,
  data: UpdatePostData
): Promise<Post> => {
  return apiHelper.patch(`/discussions/posts/${Number(postId)}`, data);
};

/** Xóa post (dùng PostID) */
export const deleteDiscussionPost = async (postId: number): Promise<void> => {
  await apiHelper.delete(`/discussions/posts/${Number(postId)}`);
};
