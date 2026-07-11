// src/components/courseLearn/LessonContentRenderer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/common/Icons';
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries';
import { useSubtitles } from '@/hooks/queries/subtitle.queries';

// Components
import QuizPlayer from './QuizPlayer';
import UnifiedVideoPlayer from './UnifiedVideoPlayer';
import VideoPlayer from './VideoPlayer';

// Types
import { Lesson } from '@/types/common.types';
import { QuizAttemptResultResponse } from '@/services/quiz.service';

interface LessonContentRendererProps {
  lesson: Lesson;
  onQuizCompleted: (result: QuizAttemptResultResponse) => void;
  onVideoProgressUpdate: (lessonId: number | string, position: number) => void;
  onVideoEnded: (lessonId: number | string) => void;
}

const LessonContentRenderer: React.FC<LessonContentRendererProps> = ({
  lesson,
  onQuizCompleted,
  onVideoProgressUpdate,
  onVideoEnded,
}) => {
  const { t } = useTranslation();
  const lessonId = Number(lesson.lessonId);
  const {
    data: videoUrlData,
    isLoading: isLoadingUrl,
    isError: isUrlError,
  } = useLessonVideoUrl(lessonId, { enabled: !!lessonId });
  const { data: subtitlesData, isLoading: isLoadingSubtitles } = useSubtitles(
    lessonId,
    { enabled: !!lessonId }
  );

  // --- Render VIDEO ---
  if (lesson.lessonType === 'VIDEO') {
    let videoSource = undefined;
    let subtitleUrl = undefined;
    if (lesson.videoSourceType === 'YOUTUBE' && lesson.externalVideoId) {
      videoSource = {
        src: `https://www.youtube.com/watch?v=${lesson.externalVideoId}`,
        type: 'video/youtube',
      };
    } else if (
      lesson.videoSourceType === 'CLOUDINARY' &&
      videoUrlData?.signedUrl
    ) {
      videoSource = {
        src: videoUrlData.signedUrl,
        type: 'video/mp4',
      };
    }
    if (subtitlesData?.subtitles && subtitlesData.subtitles.length > 0) {
      const sub =
        subtitlesData.subtitles.find((s) => s.isDefault) ||
        subtitlesData.subtitles[0];
      subtitleUrl = sub.subtitleUrl;
    }

    if (isLoadingUrl || isLoadingSubtitles) {
      return (
        <div className='p-8 text-center text-gray-400'>Đang tải video...</div>
      );
    }
    if (isUrlError) {
      return (
        <div className='p-8 text-center text-red-500'>
          Không lấy được link video. Vui lòng thử lại.
        </div>
      );
    }
    return (
      <div className='bg-black rounded-lg overflow-hidden shadow-2xl animate-fadeIn'>
        {videoSource ? (
          <VideoPlayer
            source={videoSource}
            srcSub={subtitleUrl}
            onProgress={(progress) =>
              onVideoProgressUpdate(lesson.lessonId!, progress.playedSeconds)
            }
            onEnded={() => onVideoEnded(lesson.lessonId!)}
          />
        ) : (
          <div className='text-center text-gray-400 p-8'>No video source</div>
        )}
        {/* Để so sánh, vẫn giữ UnifiedVideoPlayer phía dưới */}
        {/*
        <UnifiedVideoPlayer
          lesson={lesson}
          onTimeUpdate={currentTime =>
            onVideoProgressUpdate(lesson.lessonId!, currentTime)
          }
          onEnded={() => onVideoEnded(lesson.lessonId!)}
        />
        */}
      </div>
    );
  }

  // --- Render TEXT ---
  if (lesson.lessonType === 'TEXT') {
    return (
      <Card className='shadow-lg animate-fadeIn border-none bg-transparent sm:bg-card sm:border'>
        <CardContent className='p-0 sm:p-6'>
          <article className='prose prose-sm sm:prose-base dark:prose-invert max-w-none lg:prose-lg xl:prose-xl mx-auto py-1 leading-relaxed'>
            {lesson.textContent ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.textContent }} />
            ) : (
              <div className='text-center py-10 text-muted-foreground'>
                <Icons.fileText className='h-12 w-12 mx-auto mb-3 opacity-40' />
                <p className='italic'>
                  {t('lessonContentRenderer.textNoContent')}
                </p>
              </div>
            )}
          </article>
        </CardContent>
      </Card>
    );
  }

  // --- Render QUIZ ---
  if (lesson.lessonType === 'QUIZ') {
    return (
      <div className='animate-fadeIn max-w-2xl mx-auto'>
        <QuizPlayer
          lessonId={lesson.lessonId!}
          lessonName={lesson.lessonName}
          onQuizComplete={onQuizCompleted}
        />
      </div>
    );
  }

  // --- Fallback ---
  return (
    <div className='p-8 text-center text-muted-foreground animate-fadeIn min-h-[300px] flex items-center justify-center'>
      {t('lessonContentRenderer.unsupportedType')}
    </div>
  );
};

export default LessonContentRenderer;
