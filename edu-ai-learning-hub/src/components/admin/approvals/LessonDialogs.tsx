// src/components/admin/approvals/LessonDialogs.tsx
import React, { useState, useEffect } from 'react'; // Thêm useState, useEffect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Thêm nếu cần nút đóng
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Thêm Button
import { Check, X, Video, Loader2, AlertCircle } from 'lucide-react';
import { Lesson } from '@/types/common.types'; // Import types chuẩn
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries'; // Hook lấy signed URL
import {
  getYoutubeEmbedUrl,
  getVimeoEmbedUrl,
} from '../../../utils/video.util'; // Import utils
import { useTranslation } from 'react-i18next';

// --- Video Preview Dialog ---
interface VideoPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
}

export const VideoPreviewDialog: React.FC<VideoPreviewDialogProps> = ({
  open,
  onOpenChange,
  lesson,
}) => {
  const { t } = useTranslation();
  // Fetch signed URL nếu là Cloudinary và có ID
  const lessonIdForQuery =
    lesson?.videoSourceType === 'CLOUDINARY' && lesson?.externalVideoId
      ? Number(lesson.lessonId)
      : undefined;
  const {
    data: videoData,
    isLoading,
    isError,
    error,
  } = useLessonVideoUrl(lessonIdForQuery);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (lesson) {
      if (lesson.videoSourceType === 'CLOUDINARY') {
        url = videoData?.signedUrl || null;
      } else if (lesson.videoSourceType === 'YOUTUBE') {
        url = getYoutubeEmbedUrl(lesson.externalVideoId || '');
      } else if (lesson.videoSourceType === 'VIMEO') {
        url = getVimeoEmbedUrl(lesson.externalVideoId || '');
      }
    }
    setVideoSrc(url);
  }, [lesson, videoData]); // Chạy lại khi lesson hoặc signed URL thay đổi

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl p-0'>
        <DialogHeader className='p-6 pb-2'>
          <DialogTitle>
            {lesson?.lessonName ||
              t('lessonDialogs.videoPreview', 'Video Preview')}
          </DialogTitle>
          {lesson?.description && (
            <DialogDescription className='text-sm'>
              {lesson.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className='aspect-video bg-black overflow-hidden'>
          {isLoading && lessonIdForQuery && (
            <div className='w-full h-full flex items-center justify-center'>
              <Loader2 className='h-12 w-12 animate-spin text-gray-500' />
            </div>
          )}
          {isError && lessonIdForQuery && (
            <div className='w-full h-full flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4'>
              <AlertCircle className='h-8 w-8 mb-2' />
              <span>
                {t('lessonDialogs.errorLoadingVideo', 'Error loading video')}
              </span>
              <span className='text-xs mt-1'>
                (
                {error?.message ||
                  t('lessonDialogs.unknownError', 'Unknown error')}
                )
              </span>
            </div>
          )}
          {videoSrc && lesson?.videoSourceType === 'CLOUDINARY' && (
            <video
              key={videoSrc}
              src={videoSrc}
              controls
              className='w-full h-full object-contain'
            />
          )}
          {videoSrc &&
            (lesson?.videoSourceType === 'YOUTUBE' ||
              lesson?.videoSourceType === 'VIMEO') && (
              <iframe
                key={videoSrc}
                src={videoSrc}
                className='w-full h-full'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                allowFullScreen
                title={lesson.lessonName}
              ></iframe>
            )}
          {!isLoading &&
            !isError &&
            !videoSrc &&
            lesson?.lessonType === 'VIDEO' && (
              <div className='w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4'>
                <Video className='h-8 w-8 mb-2' />
                <span>
                  {t(
                    'lessonDialogs.noVideoSource',
                    'Video source not available'
                  )}
                </span>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Text Content Dialog ---
interface TextContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
}

export const TextContentDialog: React.FC<TextContentDialogProps> = ({
  open,
  onOpenChange,
  lesson,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>
            {lesson?.lessonName ||
              t('lessonDialogs.textContent', 'Text Content')}
          </DialogTitle>
          {lesson?.description && (
            <DialogDescription className='text-sm'>
              {lesson.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className='max-h-[70vh] mt-4 border rounded-md'>
          {lesson?.textContent ? (
            <div
              className='prose prose-sm sm:prose-base dark:prose-invert max-w-none p-4'
              dangerouslySetInnerHTML={{ __html: lesson.textContent }}
            />
          ) : (
            <p className='text-muted-foreground text-center py-12'>
              {t('lessonDialogs.noContent', 'No content available.')}
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// --- Quiz Content Dialog ---
interface QuizContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
}

export const QuizContentDialog: React.FC<QuizContentDialogProps> = ({
  open,
  onOpenChange,
  lesson,
}) => {
  const { t } = useTranslation();
  // Sắp xếp câu hỏi và lựa chọn một lần
  const sortedQuestions = React.useMemo(() => {
    return (
      lesson?.questions
        ?.map((q) => ({
          ...q,
          options: [...(q.options || [])].sort(
            (a, b) => a.optionOrder - b.optionOrder
          ),
        }))
        .sort((a, b) => a.questionOrder - b.questionOrder) || []
    );
  }, [lesson?.questions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl'>
        <DialogHeader>
          <DialogTitle>
            {lesson?.lessonName ||
              t('lessonDialogs.quizPreview', 'Quiz Preview')}
          </DialogTitle>
          {lesson?.description && (
            <DialogDescription className='text-sm'>
              {lesson.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <ScrollArea className='max-h-[70vh] mt-4 pr-2'>
          <div className='space-y-6'>
            {sortedQuestions.length > 0 ? (
              sortedQuestions.map((question, index) => (
                <div
                  key={question.questionId}
                  className='border rounded-lg p-4 space-y-3 bg-background shadow-sm'
                >
                  {/* Question */}
                  <div className='flex items-start gap-3'>
                    <Badge variant='secondary' className='mt-0.5'>
                      {index + 1}
                    </Badge>
                    <p className='font-medium flex-1'>
                      {question.questionText}
                    </p>
                  </div>
                  {/* Options */}
                  <div className='space-y-2 pl-8'>
                    {question.options.map((option) => (
                      <div
                        key={option.optionId}
                        className={`flex items-center gap-2 text-sm p-2 border rounded-md ${
                          option.isCorrectAnswer
                            ? 'border-green-300 bg-green-50 dark:bg-green-900/30'
                            : 'border-border'
                        }`}
                      >
                        {option.isCorrectAnswer ? (
                          <Check className='h-4 w-4 text-green-600 shrink-0' />
                        ) : (
                          <div className='w-4 h-4 shrink-0'></div>
                        )}
                        <span
                          className={
                            option.isCorrectAnswer
                              ? 'font-semibold text-green-700 dark:text-green-300'
                              : ''
                          }
                        >
                          {option.optionText}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Explanation */}
                  {question.explanation && (
                    <div className='pl-8 pt-3 border-t mt-3'>
                      <p className='text-xs font-semibold text-muted-foreground mb-1'>
                        {t('lessonDialogs.explanation', 'Explanation:')}
                      </p>
                      <p className='text-sm italic text-muted-foreground'>
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className='text-muted-foreground text-center py-12'>
                {t('lessonDialogs.noQuestions', 'No questions in this quiz.')}
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
