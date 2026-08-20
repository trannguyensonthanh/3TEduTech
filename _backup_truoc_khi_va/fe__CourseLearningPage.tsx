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
        lessonId === activeLessonData.lesson.lessonId &&
        !activeLessonData.lesson.isCompleted
      ) {
        markCompleteMutate({ lessonId, isCompleted: true });
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
          <div className='max-w-md mx-auto bg-card p-8 rounded-lg shadow-xl'>
            <AlertTriangle className='h-16 w-16 mx-auto mb-4 text-amber-500' />
            <h1 className='text-2xl font-bold'>Authentication Required</h1>
            <p className='mt-2 text-muted-foreground'>
              Please{' '}
              <Link
                to={`/`}
                className='text-primary hover:underline font-semibold'
              >
                log in
              </Link>{' '}
              to access this course.
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
          <div className='max-w-md mx-auto bg-card p-8 rounded-lg shadow-xl'>
            <XCircle className='h-16 w-16 mx-auto mb-4 text-destructive' />
            <h1 className='text-2xl font-bold'>Error Loading Course</h1>
            <p className='mt-2 text-muted-foreground'>
              {(error as Error)?.message || 'Could not load course details.'}
            </p>
            <Button asChild className='mt-6'>
              <Link to='/my-courses'>Back to My Learning</Link>
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
          <div className='max-w-md mx-auto bg-card p-8 rounded-lg shadow-xl'>
            <AlertTriangle className='h-16 w-16 mx-auto mb-4 text-amber-500' />
            <h1 className='text-2xl font-bold'>Access Denied</h1>
            <p className='mt-2 text-muted-foreground'>
              You are not enrolled in this course or it requires purchase.
            </p>
            <Button asChild className='mt-6'>
              <Link to={`/courses/${course.slug}`}>Go to Course Page</Link>
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
          <div className='max-w-md mx-auto bg-card p-8 rounded-lg shadow-xl'>
            <InfoIcon className='h-16 w-16 mx-auto mb-4 text-blue-500' />
            <h1 className='text-2xl font-bold'>Content Coming Soon</h1>
            <p className='mt-2 text-muted-foreground'>
              This course doesn't have any lessons yet. Please check back later.
            </p>
            <Button asChild className='mt-6'>
              <Link to='/my-courses'>Back to My Learning</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  if (!activeLessonData) {
    // Chưa xác định được bài học active (ví dụ URL sai, logic init lỗi)
    return <FullScreenLoader text='Finding your lesson...' />; // Hoặc một UI lỗi khác
  }
  return (
    <div className='flex h-screen overflow-hidden bg-muted/10 dark:bg-background'>
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
