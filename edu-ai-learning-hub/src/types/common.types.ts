// Utility Types
export type IsoDateTimeString = string;
export type IsoDateString = string;

// Basic User/Entity Info
export interface UserProfileBasic {
  accountId: number;
  fullName: string;
  avatarUrl?: string | null;
}

export interface CategoryBasic {
  categoryId: number;
  categoryName: string;
}

export interface LevelBasic {
  levelId: number;
  levelName: string;
}

// Course Content Enums & Types
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ';
export type VideoSourceType = 'CLOUDINARY' | 'YOUTUBE' | 'VIMEO';

export interface AttachmentFE {
  attachmentId: number;
  tempId?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null; // bytes
}

export interface SubtitleFE {
  subtitleId: number;
  tempId?: string;
  languageCode: string;
  languageName?: string;
  subtitleUrl: string;
  isDefault: boolean;
}

export interface Lesson {
  lessonId: number;
  sectionId?: number; // ID of the section this lesson belongs to
  lessonName: string;
  description?: string | null;
  lessonOrder: number;
  lessonType: LessonType;
  isFreePreview: boolean;
  videoSourceType?: VideoSourceType | null;
  externalVideoId?: string | null;
  videoDurationSeconds?: number | null;
  textContent?: string | null;
  attachments?: AttachmentFE[];
  subtitles?: SubtitleFE[];
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  isCompleted?: boolean; // User progress related
  lastWatchedPosition?: number | null; // User progress related
  thumbnailUrl?: string | null; // Optional thumbnail for video lessons
  questions?: {
    questionId: number;
    questionText: string;
    options: {
      optionId: number;
      optionText: string;
      isCorrectAnswer: boolean;
      optionOrder?: number;
    }[];
  }[]; // For quiz lessons
}

export interface Section {
  sectionId: number;
  sectionName: string;
  sectionOrder: number;
  lessons: Lesson[];
  description?: string | null;
}

// Core Entities
export interface Category {
  categoryId: number;
  categoryName: string;
  slug?: string;
  // Add other fields if present in original Category {…} and needed
}

export interface Level {
  levelId: number;
  levelName: string;
  // Add other fields if present in original Level {…} and needed
}

export type AccountStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BANNED'
  | 'PENDING_VERIFICATION';

export type LoginType = 'EMAIL' | 'GOOGLE' | 'FACEBOOK';

export interface UserProfile {
  accountId: number;
  fullName: string;
  avatarUrl?: string | null;
  email?: string;
  registrationDate?: IsoDateTimeString;
  accountStatus?: AccountStatus;
  loginType?: LoginType;
  dateOfBirth?: IsoDateString | null;
  bio?: string | null;
  // Add other fields from original UserProfile {…} if needed by Course/InstructorProfile
}

export interface Skill {
  skillId: number;
  skillName: string;
}

export interface InstructorSkill {
  instructorSkillId: number;
  accountId: number;
  skillId: number;
  skill?: Skill;
}

export interface InstructorSocialLink {
  socialLinkId: number;
  accountId: number;
  platformName: string;
  profileUrl: string;
}

export interface InstructorProfile {
  accountId: number; // Should match UserProfile.accountId
  professionalTitle?: string | null;
  instructorBio?: string | null;
  skills?: InstructorSkill[];
  socialLinks?: InstructorSocialLink[];
  // Add other fields from original InstructorProfile {…} if needed
}

export enum CourseStatusId {
  DRAFT = 'DRAFT', // Or use numbers like 1, 2, 3 if your backend uses them
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
  UPDATING = 'UPDATING', // If you have a status for courses being updated
  // PENDING_APPROVAL = 2, (Example if numeric)
}

export interface CourseStatus {
  statusId: CourseStatusId | string; // Allow string for flexibility
  statusName: string;
}

export interface Course {
  courseId: number;
  courseName: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  thumbnailUrl?: string | null;
  introVideoUrl?: string | null;
  originalPrice: number;
  discountedPrice?: number | null;
  language: string;
  categoryId: number;
  levelId: number;
  instructorAccountId: number;
  statusId: CourseStatusId | string;
  createdAt?: IsoDateTimeString;
  updatedAt?: IsoDateTimeString;
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
  studentCount?: number;
  totalDurationSeconds?: number;
  lessonsCount?: number;
  requirements?: string;
  learningOutcomes?: string;
  category?: Category;
  level?: Level;
  instructor?: Pick<UserProfile, 'accountId' | 'fullName' | 'avatarUrl'> & {
    instructorProfile?: Pick<InstructorProfile, 'professionalTitle'>;
  };
  sections?: Section[];
  status?: CourseStatus;
}

// Marked Types & Directly Relate
export interface ReviewCourseData {
  // được dùng trong code này
  decision: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
}

export const SORT_OPTIONS = [
  // được dùng trong code này
  { value: 'studentCount_desc', label: 'Most Popular' },
  { value: 'averageRating_desc', label: 'Highest Rated' },
  { value: 'createdAt_desc', label: 'Newest' },
  { value: 'originalPrice_asc', label: 'Price: Low to High' },
  { value: 'originalPrice_desc', label: 'Price: High to Low' },
] as const;

export type SortByValue = (typeof SORT_OPTIONS)[number]['value']; // đuợc dùng trong code này

export interface CourseQueryParams {
  // được dùng trong code này
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: SortByValue;
  categoryId?: number | null;
  categorySlug?: string | null;
  levelId?: number | null;
  levelIds?: string | null; // If API accepts comma-separated string
  language?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  isFree?: boolean | null;
  isFeatured?: 0 | 1 | null; // Or boolean
}

export type InstructorCourseStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface CategoryFilterItem {
  // được dùng trong code này
  categoryId: number;
  categoryName: string;
  // courseCount?: number; // Optional, if available and needed
}

// Note: LevelFilterItem and LanguageFilterItem were not marked and are assumed to be removed
// unless they are in filter.types.ts or proven to be direct dependencies.

export const INSTRUCTOR_SORT_OPTIONS = [
  // Not explicitly marked but SortByValue for instructor is
  { value: 'rating:desc', label: 'Highest Rated' },
  { value: 'studentCount:desc', label: 'Most Students' },
  { value: 'courseCount:desc', label: 'Most Courses' },
  { value: 'name:asc', label: 'Name (A-Z)' },
  { value: 'name:desc', label: 'Name (Z-A)' },
] as const;

export type InstructorSortByValue = // đuợc dùng trong code này
  (typeof INSTRUCTOR_SORT_OPTIONS)[number]['value'];

export interface UserLessonProgress {
  // đuợc dùng trong code này
  isCompleted: boolean;
  lastWatchedPosition?: number | null; // seconds
}

export interface CourseReview {
  reviewId: number;
  user: UserProfileBasic;
  rating: number;
  comment?: string | null;
  reviewedAt: IsoDateTimeString;
}

export interface CourseReviewListResponse {
  reviews: CourseReview[];
  total: number;
  averageRating: number | null;
  ratingDistribution?: { rating: number; count: number; percentage: number }[];
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseReviewQueryParams {
  // được dùng trong code này
  courseId: number;
  page?: number;
  limit?: number;
  sortBy?: 'reviewedAt_desc' | 'reviewedAt_asc' | 'rating_desc' | 'rating_asc';
  rating?: number; // Filter by specific rating
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export interface CourseLearningData {
  // đươc dùng trong code này
  courseId: number;
  courseName: string;
  slug: string;
  instructorName?: string; // Denormalized for convenience
  instructorAvatar?: string | null;
  instructorId?: number;
  sections: Section[]; // Full curriculum
  isEnrolled: boolean;
  userProgress?: {
    // Key is lessonId (number)
    [lessonId: string]: UserLessonProgress; // Changed lessonId to string key as object keys are strings
  };
  totalLessons?: number; // Calculated
  // Fields for CourseInfoDialog if needed
  originalPrice?: number;
  discountedPrice?: number | null;
  categoryName?: string;
  levelName?: string;
}

export interface SubmitQuizAnswerPayload {
  // => được sử dụng
  questionId: number;
  selectedOptionId: number | null; // Allow null if no answer or for certain question types
}
