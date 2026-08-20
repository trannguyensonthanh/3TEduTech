// src/pages/CourseLearningPage.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

// UI & Layout
import { Button } from '@/components/ui/button';
import SidebarComponent from '@/components/courseLearn/Sidebar';
import LessonContentWrapper from '@/components/courseLearn/LessonContentWrapper';
import AIAssistantDialog from '@/components/courseLearn/AIAssistantDialog';
import FullScreenLoader from '@/components/common/FullScreenLoader';
import { Icons } from '@/components/common/Icons';

// Hooks & Contexts
import { useCourseDetailBySlug } from '@/hooks/queries/course.queries';
import { useUpdateLastWatchedPosition } from '@/hooks/queries/progress.queries';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseNavigation } from '@/hooks/useCourseNavigation';
import { useLessonTimeTracker } from '@/hooks/useLessonTimeTracker';
import { CourseLearningData } from '@/types/common.types';
import { AlertTriangle, InfoIcon, XCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useSettings } from '@/contexts/SettingsContext';

const VIDEO_PROGRESS_UPDATE_DEBOUNCE_TIME = 15000;

const CourseLearningPage: React.FC = () => {
  const {
    courseSlug,
    sectionId: sectionIdFromUrl,
    lessonId: lessonIdFromUrl,
  } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData: user } = useAuth();

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useCourseDetailBySlug(courseSlug!, {
    enabled: !!user && !!courseSlug,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<number | string | null>(
    null
  );
  const { formatPrice } = useSettings(); // Assuming you have a formatPrice function in your auth context
  // --- Logic Điều hướng và Tiến độ được đóng gói trong custom hook ---
  const allLessonsFlat = useMemo(() => {
    if (!course?.sections) return [];
    return course.sections
      .sort((a, b) => a.sectionOrder - b.sectionOrder)
      .flatMap((section) =>
        section.lessons
          .sort((a, b) => a.lessonOrder - b.lessonOrder)
          .map((lesson) => ({
            sectionId: section.sectionId,
            lesson: {
              ...lesson,
              isCompleted:
                !!course.userProgress?.[lesson.lessonId]?.isCompleted,
            },
          }))
      );
  }, [course]);

  const activeLessonData = useMemo(
    () =>
      allLessonsFlat.find((item) => item.lesson.lessonId === activeLessonId) ||
      null,
    [activeLessonId, allLessonsFlat]
  );

  const {
    isMarkingCompletion,
    handleNavigateToLessonDirection,
    handleQuizCompleted,
    markCompleteMutate,
  } = useCourseNavigation({
    course: course as CourseLearningData,
    allLessonsFlat,
    activeLesson: activeLessonData?.lesson || null,
  });

  // --- Logic Cập nhật thời gian học chung (Time Tracker) ---
  const isTimeTrackerEnabled = !!user && !!course && (course.isEnrolled || user.role === 'SA' || (course.pricing.display.originalPrice === 0 && course.pricing.display.discountedPrice === 0));
  useLessonTimeTracker(activeLessonId, isTimeTrackerEnabled);

  // --- Logic Cập nhật thời gian xem Video ---
  const { mutate: updatePositionMutate } = useUpdateLastWatchedPosition();
  const debouncedPositionRef = useRef<{
    lessonId: number;
    position: number;
  } | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleVideoProgressUpdate = useCallback(
    (lessonId: number, position: number) => {
      debouncedPositionRef.current = { lessonId, position };
      if (!debounceTimeoutRef.current) {
        debounceTimeoutRef.current = setTimeout(() => {
          if (debouncedPositionRef.current) {
            updatePositionMutate(debouncedPositionRef.current);
            debouncedPositionRef.current = null;
          }
          debounceTimeoutRef.current = null;
        }, VIDEO_PROGRESS_UPDATE_DEBOUNCE_TIME);
      }
    },
    [updatePositionMutate]
  );

  const handleVideoEnded = useCallback(
    (lessonId: number) => {
      if (
        activeLessonData &&
        Number(lessonId) === Number(activeLessonData.lesson.lessonId) &&
        !activeLessonData.lesson.isCompleted
      ) {
        markCompleteMutate({ lessonId: Number(lessonId), isCompleted: true });
      }
    },
    [activeLessonData, markCompleteMutate]
  );

  // --- Effect chính để xác định bài học cần hiển thị ---
  useEffect(() => {
    if (course && allLessonsFlat.length > 0 && !isLoading) {
      const lessonFromUrl = allLessonsFlat.find(
        (l) =>
          String(l.lesson.lessonId) === lessonIdFromUrl &&
          String(l.sectionId) === sectionIdFromUrl
      );
      if (lessonFromUrl) {
        if (activeLessonId !== lessonFromUrl.lesson.lessonId) {
          setActiveLessonId(lessonFromUrl.lesson.lessonId);
        }
      } else {
        const firstUncompleted =
          allLessonsFlat.find((item) => !item.lesson.isCompleted) ||
          allLessonsFlat[0];
        if (firstUncompleted) {
          navigate(
            `/learn/${courseSlug}/sections/${firstUncompleted.sectionId}/lessons/${firstUncompleted.lesson.lessonId}`,
            { replace: true }
          );
        }
      }
    }
  }, [
    course,
    allLessonsFlat,
    lessonIdFromUrl,
    sectionIdFromUrl,
    navigate,
    courseSlug,
    isLoading,
    activeLessonId,
  ]);

  // --- Effect cho responsive sidebar ---
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Render Logic ---
  if (isLoading && !course) return <FullScreenLoader />;
  if (!user) {
    // User chưa đăng nhập
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <div className='max-w-md mx-auto rounded-xl border border-border bg-card p-8'>
            <AlertTriangle className='h-16 w-16 mx-auto mb-4 text-warning' />
            <h1 className='text-2xl font-bold'>Cần đăng nhập</h1>
            <p className='mt-2 text-muted-foreground'>
              Vui lòng{' '}
              <Link
                to={`/`}
                className='text-primary hover:underline font-semibold'
              >
                đăng nhập
              </Link>{' '}
              để vào học khóa này.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  if (isError || !course) {
    // Lỗi load khóa học hoặc không có data
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <div className='max-w-md mx-auto rounded-xl border border-border bg-card p-8'>
            <XCircle className='h-16 w-16 mx-auto mb-4 text-destructive' />
            <h1 className='text-2xl font-bold'>Không tải được khóa học</h1>
            <p className='mt-2 text-muted-foreground'>
              {(error as Error)?.message || 'Không lấy được thông tin khóa học.'}
            </p>
            <Button asChild className='mt-6'>
              <Link to='/my-courses'>Về khóa học của tôi</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  // Điều kiện truy cập: enrolled HOẶC admin HOẶC khóa học free
  const canAccessCourse =
    course.isEnrolled ||
    user.role === 'SA' ||
    (course.pricing.display.originalPrice === 0 &&
      course.pricing.display.discountedPrice === 0);
  if (!canAccessCourse) {
    // Không có quyền truy cập
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <div className='max-w-md mx-auto rounded-xl border border-border bg-card p-8'>
            <AlertTriangle className='h-16 w-16 mx-auto mb-4 text-warning' />
            <h1 className='text-2xl font-bold'>Không có quyền truy cập</h1>
            <p className='mt-2 text-muted-foreground'>
              Bạn chưa ghi danh khóa học này, hoặc khóa học cần mua trước khi
              học.
            </p>
            <Button asChild className='mt-6'>
              <Link to={`/courses/${course.slug}`}>Xem trang khóa học</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  if (allLessonsFlat.length === 0 && !isLoading) {
    // Khóa học không có bài giảng
    return (
      <Layout>
        <div className='container mx-auto p-12 text-center'>
          <div className='max-w-md mx-auto rounded-xl border border-border bg-card p-8'>
            <InfoIcon className='h-16 w-16 mx-auto mb-4 text-primary' />
            <h1 className='text-2xl font-bold'>Nội dung sắp có</h1>
            <p className='mt-2 text-muted-foreground'>
              Khóa học này chưa có bài giảng nào. Bạn quay lại sau nhé.
            </p>
            <Button asChild className='mt-6'>
              <Link to='/my-courses'>Về khóa học của tôi</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  if (!activeLessonData) {
    // Chưa xác định được bài học active (ví dụ URL sai, logic init lỗi)
    return <FullScreenLoader text='Đang tìm bài học của bạn…' />; // Hoặc một UI lỗi khác
  }
  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <SidebarComponent
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        courseData={course as CourseLearningData}
        activeLessonId={activeLessonId}
        onLessonSelect={(lessonId, sectionId) =>
          navigate(
            `/learn/${courseSlug}/sections/${sectionId}/lessons/${lessonId}`
          )
        }
        onToggleAIAssistant={() => setIsAIAssistantOpen((p) => !p)}
      />

      <LessonContentWrapper
        course={course as CourseLearningData}
        activeLesson={activeLessonData.lesson}
        activeSection={
          course.sections.find(
            (s) => Number(s.sectionId) === Number(activeLessonData.sectionId)
          )!
        }
        allLessonsFlat={allLessonsFlat}
        onNavigateLesson={handleNavigateToLessonDirection}
        onMarkCompleteToggle={(lessonId, status) =>
          markCompleteMutate({
            lessonId: Number(lessonId),
            isCompleted: !status,
          })
        }
        isMarkingCompletion={isMarkingCompletion}
        onQuizCompleted={handleQuizCompleted}
        onVideoProgressUpdate={handleVideoProgressUpdate}
        onVideoEnded={handleVideoEnded}
      />

      {user && (
        <AIAssistantDialog
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          lessonContext={activeLessonData.lesson}
          courseContext={course}
        />
      )}
    </div>
  );
};

export default CourseLearningPage;
