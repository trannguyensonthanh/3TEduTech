// src/hooks/useCourseNavigation.ts
import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useMarkLessonCompletion } from '@/hooks/queries/progress.queries';
import { CourseLearningData, Lesson } from '@/types/common.types';
import { QuizAttemptResultResponse } from '@/services/quiz.service';
import { courseKeys } from '@/hooks/queries/course.queries';

interface UseCourseNavigationProps {
  course: CourseLearningData;
  allLessonsFlat: { lesson: Lesson; sectionId: string | number }[];
  activeLesson: Lesson | null;
}

export const useCourseNavigation = ({
  course,
  allLessonsFlat,
  activeLesson,
}: UseCourseNavigationProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: markCompleteMutate, isPending: isMarkingCompletion } =
    useMarkLessonCompletion();
  console.log('activeLesson', activeLesson);
  const currentLessonOverallIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return allLessonsFlat.findIndex(
      (item) => item.lesson.lessonId === activeLesson.lessonId
    );
  }, [activeLesson, allLessonsFlat]);

  const navigateToLesson = useCallback(
    (lessonId: number | string, sectionId: number | string) => {
      navigate(
        `/learn/${course?.slug}/sections/${sectionId}/lessons/${lessonId}`
      );
    },
    [navigate, course?.slug]
  );

  const handleNavigateToLessonDirection = useCallback(
    (direction: 'prev' | 'next') => {
      if (currentLessonOverallIndex === -1) return;

      let targetItem = null;
      if (direction === 'prev' && currentLessonOverallIndex > 0) {
        targetItem = allLessonsFlat[currentLessonOverallIndex - 1];
      } else if (direction === 'next') {
        if (currentLessonOverallIndex < allLessonsFlat.length - 1) {
          targetItem = allLessonsFlat[currentLessonOverallIndex + 1];
          // Auto-complete a non-quiz lesson when moving next
          if (
            activeLesson &&
            !activeLesson.isCompleted &&
            activeLesson.lessonType !== 'QUIZ'
          ) {
            markCompleteMutate({
              lessonId: Number(activeLesson.lessonId),
              isCompleted: true,
            });
          }
        } else {
          // Reached the end
          if (activeLesson && !activeLesson.isCompleted) {
            markCompleteMutate({
              lessonId: Number(activeLesson.lessonId),
              isCompleted: true,
            });
          }
          toast.success("Congratulations! You've completed the course.", {
            action: {
              label: 'Leave a Review',
              onClick: () => navigate(`/courses/${course.slug}`),
            },
          });
          return;
        }
      }

      if (targetItem) {
        navigateToLesson(targetItem.lesson.lessonId!, targetItem.sectionId);
      }
    },
    [
      currentLessonOverallIndex,
      allLessonsFlat,
      activeLesson,
      navigateToLesson,
      markCompleteMutate,
      course?.slug,
      navigate,
    ]
  );

  const handleQuizCompleted = useCallback(
    (result: QuizAttemptResultResponse) => {
      queryClient.invalidateQueries({
        queryKey: courseKeys.detailBySlug(course.slug),
      });
      const isPassed = result.attempt.isPassed ?? false;

      if (isPassed && activeLesson?.lessonId === result.attempt.lessonId) {
        if (!activeLesson.isCompleted) {
          markCompleteMutate({
            lessonId: Number(activeLesson.lessonId),
            isCompleted: true,
          });
        }
        toast.info(`Quiz Passed! Score: ${result.attempt.score?.toFixed(0)}%`, {
          description: 'Moving to the next lesson...',
          duration: 4000,
        });
        setTimeout(() => handleNavigateToLessonDirection('next'), 4000);
      } else if (activeLesson?.lessonId === result.attempt.lessonId) {
        toast.warning(`Quiz Score: ${result.attempt.score?.toFixed(0)}%`, {
          description: 'Review your answers and try again to proceed.',
        });
      }
    },
    [
      activeLesson,
      course?.slug,
      handleNavigateToLessonDirection,
      markCompleteMutate,
      queryClient,
    ]
  );

  return {
    isMarkingCompletion,
    handleNavigateToLessonDirection,
    handleQuizCompleted,
    markCompleteMutate,
  };
};
