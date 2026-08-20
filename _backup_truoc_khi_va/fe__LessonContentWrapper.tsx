// src/components/courseLearn/LessonContentWrapper.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// UI Components
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/Icons';

// Child Components
import LessonTabs from './LessonTabs';
import LessonContentRenderer from './LessonContentRenderer';

// Types
import { CourseLearningData, Lesson } from '@/types/common.types';
import { QuizAttemptResultResponse } from '@/services/quiz.service';
import { Section } from '@/services/section.service';
import { SectionWithLessons } from '@/services/course.service';

interface LessonContentWrapperProps {
  course: CourseLearningData;
  activeLesson: Lesson | null;
  activeSection: Section | SectionWithLessons | null;
  allLessonsFlat: { lesson: Lesson; sectionId: number | string }[];
  onNavigateLesson: (direction: 'prev' | 'next') => void;
  onMarkCompleteToggle: (
    lessonId: number | string,
    currentCompletionStatus: boolean
  ) => void;
  isMarkingCompletion?: boolean;
  onQuizCompleted: (result: QuizAttemptResultResponse) => void;
  onVideoProgressUpdate: (lessonId: number | string, position: number) => void;
  onVideoEnded: (lessonId: number | string) => void;
}

const LessonContentWrapper: React.FC<LessonContentWrapperProps> = ({
  course,
  activeLesson,
  activeSection,
  allLessonsFlat,
  onNavigateLesson,
  onMarkCompleteToggle,
  isMarkingCompletion,
  onQuizCompleted,
  onVideoProgressUpdate,
  onVideoEnded,
}) => {
  const { t } = useTranslation();
  console.log('course', course);
  if (!activeLesson || !activeSection) {
    return (
      <main className='flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/30 dark:bg-background'>
        <Icons.playCircle className='h-20 w-20 text-muted-foreground opacity-50 mb-4' />
        <h2 className='text-xl font-semibold text-muted-foreground'>
          {t('lessonContentWrapper.selectLessonTitle')}
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          {t('lessonContentWrapper.selectLessonDesc')}
        </p>
      </main>
    );
  }

  const currentLessonIndex = allLessonsFlat.findIndex(
    (l) => l.lesson.lessonId === activeLesson.lessonId
  );
  const hasPrevLesson = currentLessonIndex > 0;
  const hasNextLesson = currentLessonIndex < allLessonsFlat.length - 1;
  const isLessonCompleted =
    course.userProgress?.[activeLesson.lessonId]?.isCompleted || false;

  return (
    <div className='flex-1 flex flex-col bg-muted/20 dark:bg-gray-900/30 overflow-hidden'>
      {/* Header */}
      <header className='sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b shadow-sm'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 max-w-full'>
          <div className='flex h-16 items-center justify-between gap-4'>
            <div className='flex items-center gap-2 min-w-0'>
              <Link
                to={`/courses/${course.slug}`}
                title='Back to Course Overview'
                className='hidden lg:inline-flex'
              >
                <Button variant='ghost' size='icon' className='shrink-0'>
                  <Icons.arrowLeft className='h-5 w-5' />
                </Button>
              </Link>
              <div className='min-w-0 flex-1'>
                <h1
                  className='text-sm sm:text-base md:text-lg font-semibold truncate'
                  title={activeLesson.lessonName}
                >
                  {activeLesson.lessonName}
                </h1>
                <p
                  className='text-xs text-muted-foreground truncate'
                  title={activeSection.sectionName}
                >
                  Part of: {activeSection.sectionName}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onNavigateLesson('prev')}
                disabled={!hasPrevLesson || isMarkingCompletion}
                className='h-9 px-2 sm:px-3'
              >
                <Icons.chevronLeft className='h-4 w-4 sm:mr-1' />
                <span className='hidden sm:inline'>
                  {t('lessonContentWrapper.prev')}
                </span>
              </Button>

              <Button
                size='sm'
                onClick={() =>
                  onMarkCompleteToggle(
                    activeLesson.lessonId!,
                    isLessonCompleted
                  )
                }
                disabled={isMarkingCompletion}
                className='h-9 px-3 whitespace-nowrap'
                variant={isLessonCompleted ? 'secondary' : 'default'}
              >
                {isMarkingCompletion ? (
                  <Icons.loader2 className='h-4 w-4 animate-spin' />
                ) : isLessonCompleted ? (
                  <Icons.checkCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
                ) : (
                  <Icons.checkCircle className='h-4 w-4' />
                )}
                <span className='hidden sm:inline ml-1.5'>
                  {isLessonCompleted
                    ? t('lessonContentWrapper.completed')
                    : t('lessonContentWrapper.markAsComplete')}
                </span>
              </Button>

              <Button
                variant='default'
                size='sm'
                onClick={() => onNavigateLesson('next')}
                disabled={isMarkingCompletion}
                className='h-9 px-2 sm:px-3'
              >
                <span className='hidden sm:inline'>
                  {hasNextLesson
                    ? t('lessonContentWrapper.next')
                    : t('lessonContentWrapper.finish')}
                </span>
                <Icons.chevronRight className='h-4 w-4 sm:ml-1' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Left: Video/Text/Quiz Content */}
        <ScrollArea className='flex-grow bg-background relative' type='auto'>
          <div className='container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full'>
            <div className='max-w-4xl mx-auto'>
              <LessonContentRenderer
                lesson={activeLesson}
                onQuizCompleted={onQuizCompleted}
                onVideoProgressUpdate={onVideoProgressUpdate}
                onVideoEnded={onVideoEnded}
              />
            </div>
          </div>
        </ScrollArea>

        <div className='shrink-0 border-t bg-card z-20 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.2)]'>
          {' '}
          {/* Cải thiện shadow */}
          <div className='container mx-auto px-0 sm:px-2 md:px-4 max-w-full'>
            <LessonTabs
              lesson={activeLesson}
              courseId={course.courseId}
              courseInstructorId={course.instructorId!}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonContentWrapper;
