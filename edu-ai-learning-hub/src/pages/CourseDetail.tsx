// src/pages/CourseDetailPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import FreePreviewModal from '@/components/courses/FreePreviewModal';
import {
  CourseReviewQueryParams,
  CreateReviewPayload,
  UserLessonProgress,
  Lesson,
} from '@/types/common.types';
import { useCourseDetailBySlug } from '@/hooks/queries/course.queries';
import {
  Star,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Lock,
  CheckCircle,
  Trash2,
  Loader2,
  Video as VideoIconLucide,
  FileText as TextIconLucide,
  HelpCircle as QuizIconLucide,
  Globe,
  FileIcon,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { formatDurationShort } from '@/utils/formatter.util';
import {
  getYoutubeEmbedUrl,
  extractYoutubeId,
  getVimeoEmbedUrl,
  extractVimeoId,
} from '@/utils/video.util';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  useCreateOrUpdateReview,
  useDeleteReview,
  useMyReviewForCourse,
  useReviewsByCourse,
} from '@/hooks/queries/review.queries';
import { Label } from '@/components/ui/label';
import { useInstructorPublicProfile } from '@/hooks/queries/instructor.queries';
import { Review } from '@/services/review.service';
import { Section } from '@/services/section.service';
import PriceCard from '@/components/courses/PriceCard';
import he from 'he';

interface CurriculumSectionItemProps {
  section: Section;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onLessonClick: (lesson: Lesson) => void;
  userProgress?: { [lessonId: string]: UserLessonProgress };
  isEnrolled: boolean;
}

const CurriculumSectionItem: React.FC<CurriculumSectionItemProps> = ({
  section,
  isExpanded,
  onToggleExpand,
  onLessonClick,
  userProgress,
  isEnrolled,
}) => {
  const totalDuration = section.lessons.reduce(
    (sum, l) => sum + (l.videoDurationSeconds || 0),
    0
  );
  const getLessonIcon = (type: Lesson['lessonType']) => {
    if (type === 'VIDEO')
      return <VideoIconLucide className='h-4 w-4 shrink-0 text-muted-foreground' />;
    if (type === 'TEXT')
      return <TextIconLucide className='h-4 w-4 shrink-0 text-muted-foreground' />;
    if (type === 'QUIZ')
      return <QuizIconLucide className='h-4 w-4 shrink-0 text-muted-foreground' />;
    return <FileIcon className='h-4 w-4 text-muted-foreground shrink-0' />;
  };
  return (
    <div className='border-b border-border last:border-b-0'>
      <button
        className='flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <div className='flex items-center gap-3 min-w-0'>
          {isExpanded ? (
            <ChevronUp size={20} className='text-muted-foreground shrink-0' />
          ) : (
            <ChevronDown size={20} className='text-muted-foreground shrink-0' />
          )}
          <h3
            className='font-semibold text-base md:text-lg truncate'
            title={section.sectionName}
          >
            {section.sectionName || 'Phần chưa đặt tên'}
          </h3>
        </div>
        <div className='text-xs text-muted-foreground whitespace-nowrap shrink-0 ml-2'>
          {section.lessons.length} bài học
          {totalDuration > 0 && ` • ${formatDurationShort(totalDuration)}`}
        </div>
      </button>
      {isExpanded && (
        <div className='divide-y divide-border border-t border-border bg-muted/30'>
          {section.lessons
            .sort((a, b) => a.lessonOrder - b.lessonOrder)
            .map((lesson) => (
              <div
                key={lesson.lessonId || lesson.tempId}
                className={`flex items-center justify-between p-3 pl-10 pr-4 transition-colors ${
                  lesson.isFreePreview || isEnrolled
                    ? 'cursor-pointer hover:bg-accent'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() =>
                  (lesson.isFreePreview || isEnrolled) && onLessonClick(lesson)
                }
                title={
                  lesson.isFreePreview || isEnrolled
                    ? `Xem: ${lesson.lessonName}`
                    : 'Ghi danh để mở bài học này'
                }
              >
                <div className='flex items-center gap-2.5 min-w-0'>
                  {getLessonIcon(lesson.lessonType)}
                  <span
                    className='text-sm truncate flex-1'
                    title={lesson.lessonName}
                  >
                    {lesson.lessonName}
                  </span>
                  {userProgress?.[lesson.lessonId]?.isCompleted && (
                    <span title='Đã hoàn thành'>
                      <CheckCircle
                        size={14}
                        className='shrink-0 text-success'
                      />
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2'>
                  {lesson.isFreePreview && (
                    <Badge variant='success' className='text-xs px-1.5 py-0.5'>
                      Học thử
                    </Badge>
                  )}
                  {!(lesson.isFreePreview || isEnrolled) && (
                    <span title='Chưa mở'>
                      <Lock size={12} />
                    </span>
                  )}
                  {lesson.lessonType === 'VIDEO' &&
                    lesson.videoDurationSeconds && (
                      <span>
                        {formatDurationShort(lesson.videoDurationSeconds)}
                      </span>
                    )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

interface ReviewItemProps {
  review: Review;
  canInteract: boolean;
  onDelete: (reviewId: number) => void;
  isDeleting: boolean;
}
const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  canInteract,
  onDelete,
  isDeleting,
}) => (
  <div className='border-b border-border py-6 last:border-b-0'>
    <div className='flex items-start space-x-3 sm:space-x-4'>
      <Avatar className='h-10 w-10 sm:h-11 sm:w-11'>
        <AvatarImage
          src={review.userAvatar || undefined}
          alt={review.userFullName}
        />
        <AvatarFallback>
          {review.userFullName?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className='flex-1'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1'>
          <h4 className='font-semibold text-sm'>{review.userFullName}</h4>
          <span className='text-xs text-muted-foreground mt-0.5 sm:mt-0'>
            {format(parseISO(review.reviewedAt), 'dd/MM/yyyy')}
          </span>
        </div>
        <div className='flex mt-0.5 mb-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`mr-0.5 ${
                i < review.rating
                  ? 'fill-warning text-warning'
                  : 'fill-muted stroke-muted-foreground'
              }`}
            />
          ))}
        </div>
        {review.comment && (
          <p className='text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed'>
            {review.comment}
          </p>
        )}
        {canInteract && (
          <Button
            variant='ghost'
            size='default'
            className='mt-2 text-xs text-destructive hover:text-destructive p-0 h-auto'
            onClick={() => onDelete(review.reviewId)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className='h-3 w-3 animate-spin mr-1' />
            ) : (
              <Trash2 size={12} className='mr-1' />
            )}{' '}
            Xóa đánh giá của tôi
          </Button>
        )}
      </div>
    </div>
  </div>
);

interface ReviewFormProps {
  courseId: number;
  currentMyReview: Review | null | undefined;
  onSubmitSuccess: () => void;
}
const ReviewForm: React.FC<ReviewFormProps> = ({
  courseId,
  currentMyReview,
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const { mutate: submitReview, isPending } = useCreateOrUpdateReview();

  useEffect(() => {
    if (currentMyReview) {
      setRating(currentMyReview.rating || 0);
      setComment(currentMyReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [currentMyReview]);

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: 'Chưa chấm điểm',
        description: 'Vui lòng chọn số sao trước khi gửi.',
        variant: 'destructive',
      });
      return;
    }
    submitReview(
      { courseId, data: { rating, comment: comment.trim() || undefined } },
      {
        onSuccess: () => {
          onSubmitSuccess();
        },
        onError: (error) => {
          toast({
            title: 'Gửi đánh giá thất bại',
            description: error.message || 'Không gửi được đánh giá.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className='rounded-xl border border-border bg-card p-4 sm:p-6'>
      <h3 className='text-lg sm:text-xl font-semibold mb-3'>
        {currentMyReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}
      </h3>
      <div className='mb-4'>
        <Label className='mb-1.5 block text-sm font-medium'>
            Điểm bạn chấm *
          </Label>
        <div className='flex items-center space-x-0.5'>
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              variant='ghost'
              size='icon'
              className={`h-7 w-7 p-0 transition-colors sm:h-8 sm:w-8 ${
                (hoverRating || rating) >= star
                  ? 'text-warning'
                  : 'text-muted-foreground'
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`Chấm ${star} trên 5 sao`}
            >
              <Star
                size={20}
                className={
                  (hoverRating || rating) >= star
                    ? 'fill-current'
                    : 'fill-muted stroke-muted-foreground'
                }
              />
            </Button>
          ))}
        </div>
      </div>
      <div className='mb-4'>
        <Label
          htmlFor='reviewComment'
          className='block mb-1.5 text-sm font-medium'
        >
          Nhận xét (không bắt buộc)
        </Label>
        <Textarea
          id='reviewComment'
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Chia sẻ cảm nhận của bạn về khóa học...'
          rows={4}
          className='resize-none'
        />
      </div>
      <Button onClick={handleSubmitReview} disabled={isPending || rating === 0}>
        {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        {currentMyReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
      </Button>
    </div>
  );
};

const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState('overview');

  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch: refetchCourseDetail,
  } = useCourseDetailBySlug(slug);

  const [reviewPage, setReviewPage] = useState(1);
  const reviewLimit = 5;
  const reviewQueryParams: CourseReviewQueryParams = useMemo(
    () => ({
      courseId: Number(course?.courseId),
      page: reviewPage,
      limit: reviewLimit,
      sortBy: 'reviewedAt_desc',
    }),
    [course?.courseId, reviewPage]
  );

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useReviewsByCourse(
    course?.courseId ? Number(course.courseId) : undefined,
    reviewQueryParams,
    { enabled: !!course?.courseId && activeContentTab === 'reviews' }
  );
  const {
    data: myReview,
    isLoading: isLoadingMyReview,
    refetch: refetchMyReview,
  } = useMyReviewForCourse(
    userData && course?.courseId ? Number(course.courseId) : undefined,
    { enabled: !!userData && !!course?.courseId }
  );
  const { mutate: deleteReviewMutate, isPending: isDeletingReview } =
    useDeleteReview();
  const { data: instructorProfile, isLoading: isLoadingInstructor } =
    useInstructorPublicProfile(course?.instructorId, {
      enabled: !!course?.instructorId && activeContentTab === 'instructor',
    });
  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const n = new Set(prev);
      if (n.has(sectionId)) n.delete(sectionId);
      else n.add(sectionId);
      return n;
    });
  };
  const handleLessonClick = (lesson: Lesson) => {
    if (lesson.isFreePreview) {
      setPreviewLesson(lesson);
      setIsPreviewModalOpen(true);
    } else if (course?.isEnrolled) {
      navigate(
        `/learn/${course.slug}/sections/${Number(
          lesson.sectionId
        )}/lessons/${Number(lesson.lessonId)}`
      );
    } else {
      toast({
        title: 'Nội dung chưa mở',
        description: 'Bạn cần ghi danh khóa học để xem bài học này.',
      });
    }
  };

  const handleDeleteMyReview = (reviewId: number) => {
    if (!course?.courseId) return;
    if (window.confirm('Xóa đánh giá của bạn? Thao tác này không thể hoàn tác.')) {
      deleteReviewMutate(
        { courseId: Number(course.courseId), reviewId },
        {
          onSuccess: () => {
            refetchCourseDetail();
            refetchMyReview();
            refetchReviews();
          },
        }
      );
    }
  };

  const handleReviewSubmitSuccess = () => {
    refetchCourseDetail();
    refetchMyReview();
    if (activeContentTab === 'reviews') refetchReviews();
  };

  if (isLoading || !slug) {
    return (
      <Layout>
        <div className='container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]'>
          <div className='w-full max-w-4xl space-y-8'>
            <div className='flex flex-col md:flex-row gap-8'>
              <div className='flex-1 space-y-4'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-10 w-3/4' />
                <Skeleton className='h-5 w-1/2' />
                <div className='flex gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-16' />
                </div>
                <div className='flex gap-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='h-4 w-32' />
              </div>
              <div className='w-full md:w-80 shrink-0'>
                <Skeleton className='aspect-video w-full rounded-lg' />
                <div className='mt-4 space-y-2'>
                  <Skeleton className='h-8 w-full' />
                  <Skeleton className='h-8 w-full' />
                </div>
              </div>
            </div>
            <div className='mt-10'>
              <div className='flex gap-4 mb-6'>
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-8 w-24' />
              </div>
              <div className='space-y-4'>
                <Skeleton className='h-6 w-1/2' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-2/3' />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  if (isError || !course) {
    return (
      <Layout>
        <div className='container mx-auto py-12 text-center'>
          <XCircle className='h-16 w-16 mx-auto mb-4 text-destructive' />
          <h1 className='text-2xl font-semibold tracking-tight'>
            Không tìm thấy khóa học
          </h1>
          <p className='mt-2 text-muted-foreground'>
            Không tìm thấy khóa học "{slug}".
          </p>
          <Button asChild className='mt-6'>
            <Link to='/courses'>Xem danh sách khóa học</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className='border-b border-border bg-muted/40 pb-10 pt-12 md:pb-14 md:pt-16'>
        <div className='container mx-auto px-4 md:px-6'>
          <div className='grid lg:grid-cols-3 gap-8 xl:gap-12 items-center'>
            <div className='lg:col-span-2'>
              <div className='flex items-center space-x-2 mb-3'>
                <Link
                  to={`/categories/${
                    course.categoryId ||
                    course.categoryName.toLowerCase().replace(/\s+/g, '-')
                  }`}
                  className='text-sm font-medium text-primary transition-colors hover:underline'
                >
                  {course.categoryName}
                </Link>
                <span className='text-muted-foreground'>•</span>
                <span className='text-sm text-muted-foreground'>
                  {course.levelName}
                </span>
              </div>
              <h1 className='mb-3 text-3xl font-semibold leading-tight tracking-tight sm:mb-4 sm:text-4xl'>
                {course.courseName}
              </h1>
              {course.shortDescription && (
                <div
                  className='mb-5 max-w-3xl text-lg text-muted-foreground'
                  dangerouslySetInnerHTML={{
                    __html: he.decode(course.shortDescription),
                  }}
                />
              )}
              <div className='flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-sm'>
                {typeof course.averageRating === 'number' && (
                  <div className='flex items-center'>
                    <span className='mr-1 font-semibold text-foreground'>
                      {course.averageRating.toFixed(1)}
                    </span>{' '}
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`mr-0.5 ${
                          i < Math.round(course.averageRating || 0)
                            ? 'fill-warning text-warning'
                            : 'fill-muted stroke-muted-foreground'
                        }`}
                      />
                    ))}{' '}
                    <span className='ml-1.5 text-muted-foreground'>
                      ({(course.reviewCount || 0).toLocaleString()} lượt đánh giá)
                    </span>
                  </div>
                )}
                <div className='flex items-center text-muted-foreground'>
                  <Users size={16} className='mr-1.5' />{' '}
                  {(course.studentCount || 0).toLocaleString()} học viên
                </div>
              </div>
              <div className='flex items-center text-sm mb-3'>
                <Link
                  to={`/instructors/${instructorProfile?.accountId}`}
                  className='flex items-center group'
                >
                  <Avatar className='mr-2.5 h-9 w-9 border border-border transition-colors group-hover:border-primary'>
                    <AvatarImage
                      src={course.instructorAvatar || undefined}
                      alt={course.instructorName}
                    />
                    <AvatarFallback>
                      {course.instructorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='font-medium text-primary group-hover:underline'>
                    {course.instructorName}
                  </span>
                </Link>
              </div>
              <div className='flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                <span className='flex items-center'>
                  <Clock size={13} className='mr-1' />
                  Cập nhật{' '}
                  {format(
                    parseISO(course.createdAt || course.updatedAt),
                    'MM/yyyy'
                  )}
                </span>
                <span className='flex items-center'>
                  <Globe size={13} className='mr-1' />
                  {course.language}
                </span>{' '}
              </div>
            </div>

            <aside className='lg:col-span-1 relative hidden lg:block'>
              <div className='lg:sticky lg:top-24'>
                <PriceCard course={course} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className='container mx-auto px-4 md:px-6 py-10 md:py-12'>
        <div className='lg:grid lg:grid-cols-3 lg:gap-8 items-start'>
          <main className='lg:col-span-2'>
            <div className='lg:hidden sticky top-20 z-20 mb-8'>
              <PriceCard course={course} />
            </div>
            <Tabs
              value={activeContentTab}
              onValueChange={setActiveContentTab}
              className='w-full'
            >
              <TabsList className='sticky top-[calc(var(--header-height,64px)+1rem)] z-10 mb-6 grid w-full grid-cols-2 gap-1 rounded-lg border border-border bg-background px-1.5 py-2 sm:grid-cols-4'>
                <TabsTrigger value='overview' className='text-sm h-9'>
                  Tổng quan
                </TabsTrigger>
                <TabsTrigger value='curriculum' className='text-sm h-9'>
                  Nội dung
                </TabsTrigger>
                <TabsTrigger value='instructor' className='text-sm h-9'>
                  Giảng viên
                </TabsTrigger>
                <TabsTrigger value='reviews' className='text-sm h-9'>
                  Đánh giá ({course.reviewCount || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-8'>
                {course.learningOutcomes && (
                  <section>
                    <h2 className='mb-4 border-b border-border pb-2 text-2xl font-semibold tracking-tight'>
                      Bạn sẽ học được gì
                    </h2>
                    <div className='grid sm:grid-cols-2 gap-x-6 gap-y-2'>
                      {(typeof course.learningOutcomes === 'string'
                        ? course.learningOutcomes
                            .split('\n')
                            .filter((s) => s.trim() !== '')
                        : course.learningOutcomes
                      ).map((outcome: string, index: number) => (
                        <div key={index} className='flex items-start text-sm'>
                          <CheckCircle className='mr-2.5 mt-0.5 h-4 w-4 shrink-0 text-success' />{' '}
                          <span
                            dangerouslySetInnerHTML={{
                              __html: he.decode(outcome),
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {course.requirements && (
                  <section>
                    <h2 className='mb-4 border-b border-border pb-2 text-2xl font-semibold tracking-tight'>
                      Yêu cầu trước khi học
                    </h2>
                    <div
                      className='prose prose-sm dark:prose-invert max-w-none leading-relaxed'
                      dangerouslySetInnerHTML={{
                        __html: he.decode(course.requirements),
                      }}
                    />
                  </section>
                )}
                {course.fullDescription && (
                  <section>
                    <h2 className='mb-4 border-b border-border pb-2 text-2xl font-semibold tracking-tight'>
                      Mô tả khóa học
                    </h2>
                    <div
                      className='prose prose-sm dark:prose-invert max-w-none leading-relaxed'
                      dangerouslySetInnerHTML={{
                        __html: he.decode(course.fullDescription),
                      }}
                    />
                  </section>
                )}
              </TabsContent>

              <TabsContent value='curriculum'>
                <div className='mb-4 flex flex-col items-start justify-between gap-2 border-b border-border pb-2 sm:flex-row sm:items-center'>
                  <h2 className='text-2xl font-semibold tracking-tight'>
                    Nội dung khóa học
                  </h2>
                  <div className='text-sm text-muted-foreground whitespace-nowrap'>
                    {course.sections.length} phần • {course.totalLessons} bài học{' '}
                    • {formatDurationShort(course.totalDuration)}
                  </div>
                </div>
                {course.isEnrolled && (
                  <div className='mb-6'>
                    <Button asChild size='lg'>
                      <Link
                        to={`/learn/${course.slug}/sections/${Number(
                          course.sections[0].sectionId
                        )}/lessons/${Number(
                          course.sections[0].lessons[0].lessonId
                        )}`}
                      >
                        <PlayCircle className='mr-2 h-5 w-5' /> Tiếp tục học
                      </Link>
                    </Button>
                  </div>
                )}
                {course.sections.length > 0 ? (
                  <div className='divide-y divide-border overflow-hidden rounded-xl border border-border'>
                    {course.sections
                      .sort((a, b) => a.sectionOrder - b.sectionOrder)
                      .map((section) => (
                        <CurriculumSectionItem
                          key={section.sectionId}
                          section={section}
                          isExpanded={expandedSections.has(section.sectionId)}
                          onToggleExpand={() =>
                            toggleSection(section.sectionId)
                          }
                          onLessonClick={handleLessonClick}
                          userProgress={course.userProgress}
                          isEnrolled={course.isEnrolled}
                        />
                      ))}
                  </div>
                ) : (
                  <p className='text-center py-8 text-muted-foreground'>
                    Chưa có nội dung cho khóa học này.
                  </p>
                )}
              </TabsContent>

              <TabsContent value='instructor'>
                <div className='rounded-xl border border-border bg-card p-4 sm:p-6'>
                  <div className='flex flex-col sm:flex-row items-start gap-5 sm:gap-6'>
                    <Link to={`/instructors/${course.instructorId}`}>
                      <Avatar className='h-24 w-24 border border-border sm:h-32 sm:w-32'>
                        <AvatarImage
                          src={course.instructorAvatar || undefined}
                          alt={course.instructorName}
                        />
                        <AvatarFallback className='text-3xl sm:text-4xl'>
                          {course.instructorName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className='flex-1'>
                      <Link
                        to={`/instructors/${instructorProfile?.accountId}`}
                        className='hover:underline'
                      >
                        <h3 className='text-xl font-semibold tracking-tight text-foreground sm:text-2xl'>
                          {course.instructorName}
                        </h3>
                      </Link>
                      <p className='text-sm text-muted-foreground mb-2'>
                        {instructorProfile?.professionalTitle || 'Giảng viên'}
                      </p>
                      <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mb-3'>
                        {typeof course.averageRating === 'number' && (
                          <span className='flex items-center'>
                            <Star size={14} className='mr-1 fill-warning text-warning' />{' '}
                            {course.averageRating.toFixed(1)} điểm đánh giá
                          </span>
                        )}
                        {typeof course.studentCount === 'number' && (
                          <span className='flex items-center'>
                            <Users size={14} className='mr-1' />{' '}
                            {course.studentCount.toLocaleString()} học viên
                          </span>
                        )}
                        {typeof instructorProfile?.totalCourses ===
                          'number' && (
                          <span className='flex items-center'>
                            <BookOpen size={14} className='mr-1' />{' '}
                            {instructorProfile?.totalCourses} khóa học
                          </span>
                        )}
                      </div>
                      {instructorProfile?.bio && (
                        <div
                          className='text-sm text-muted-foreground leading-relaxed line-clamp-5'
                          dangerouslySetInnerHTML={{
                            __html: instructorProfile.bio,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  {instructorProfile?.aboutMe && (
                    <div
                      className='prose prose-sm mt-6 max-w-none border-t border-border pt-4 dark:prose-invert'
                      dangerouslySetInnerHTML={{
                        __html: he.decode(instructorProfile.aboutMe),
                      }}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value='reviews'>
                <h2 className='mb-6 border-b border-border pb-2 text-2xl font-semibold tracking-tight'>
                  Đánh giá của học viên
                </h2>
                {reviewsData && reviewsData.averageRating !== null && (
                  <div className='mb-8 flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:gap-6 sm:p-6'>
                    <div className='text-center sm:text-left shrink-0'>
                      <div className='text-3xl font-semibold tabular-nums tracking-tight text-foreground'>
                        {reviewsData.averageRating.toFixed(1)}
                      </div>
                      <div className='flex justify-center sm:justify-start mt-1'>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            className={`mr-0.5 ${
                              i < Math.round(reviewsData.averageRating || 0)
                                ? 'fill-warning text-warning'
                                : 'fill-muted stroke-muted-foreground'
                            }`}
                          />
                        ))}
                      </div>
                      <p className='text-sm text-muted-foreground mt-1'>
                        Điểm trung bình
                      </p>
                    </div>
                  </div>
                )}

                {userData && course.isEnrolled && (
                  <div className='mb-8'>
                    <ReviewForm
                      courseId={Number(course.courseId)}
                      currentMyReview={myReview}
                      onSubmitSuccess={handleReviewSubmitSuccess}
                    />
                  </div>
                )}
                {!userData && (
                  <p className='mb-6 text-sm text-muted-foreground'>
                    <Link to='/' className='text-primary hover:underline'>
                      Đăng nhập
                    </Link>{' '}
                    để gửi đánh giá.
                  </p>
                )}
                {!course.isEnrolled && userData && (
                  <p className='mb-6 text-sm text-muted-foreground'>
                    Bạn cần ghi danh khóa học này để gửi đánh giá.
                  </p>
                )}

                {isLoadingReviews ? (
                  <div className='space-y-4'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton
                        key={`rev-skel-${i}`}
                        className='h-24 w-full rounded-md'
                      />
                    ))}
                  </div>
                ) : reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  <div className='space-y-6'>
                    {reviewsData.reviews.map((review) => (
                      <ReviewItem
                        key={review.reviewId}
                        review={review}
                        canInteract={
                          Number(userData?.id) === Number(review.accountId)
                        }
                        onDelete={handleDeleteMyReview}
                        isDeleting={
                          isDeletingReview &&
                          myReview?.reviewId === review.reviewId
                        }
                      />
                    ))}
                    {reviewsData.totalPages > 1 && (
                      <div className='flex justify-center pt-4'>
                        <PaginationControls
                          currentPage={reviewPage}
                          totalPages={reviewsData.totalPages}
                          setCurrentPage={setReviewPage}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-center py-8'>
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <FreePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        lesson={previewLesson}
      />
    </Layout>
  );
};

export default CourseDetailPage;
