// src/components/admin/courses/LessonDetailsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/common/Icons';
import { Separator } from '@/components/ui/separator';
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries';
import {
  getYoutubeEmbedUrl,
  extractYoutubeId,
  getVimeoEmbedUrl,
  extractVimeoId,
} from '@/utils/video.util';
import { Lesson } from '@/types/common.types';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDurationShort } from '@/utils/formatter.util';

interface LessonDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: (Lesson & { sectionTitle?: string }) | null;
}

const LessonDetailsDialog: React.FC<LessonDetailsDialogProps> = ({
  open,
  onOpenChange,
  lesson,
}) => {
  const lessonId = lesson?.lessonId ? Number(lesson.lessonId) : undefined;
  const isCloudinaryVideo =
    lesson?.videoSourceType === 'CLOUDINARY' && lesson?.externalVideoId;

  const { data: signedUrlData, isLoading: isLoadingUrl } = useLessonVideoUrl(
    isCloudinaryVideo ? lessonId : undefined,
    { enabled: open && !!isCloudinaryVideo }
  );

  if (!lesson) return null;

  let videoEmbedUrl: string | null = null;
  if (lesson.videoSourceType === 'YOUTUBE') {
    videoEmbedUrl = getYoutubeEmbedUrl(
      extractYoutubeId(lesson.externalVideoId || '') || ''
    );
  } else if (lesson.videoSourceType === 'VIMEO') {
    videoEmbedUrl = getVimeoEmbedUrl(
      extractVimeoId(lesson.externalVideoId || '') || ''
    );
  } else if (isCloudinaryVideo) {
    videoEmbedUrl = signedUrlData?.signedUrl || null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[85vh]'>
        <DialogHeader>
          <DialogTitle className='truncate' title={lesson.lessonName}>
            {lesson.lessonName}
          </DialogTitle>
          <DialogDescription>
            Lesson details from section: "{lesson.sectionTitle}"
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='max-h-[65vh] p-1 -mx-1'>
          <div className='px-4 py-2 space-y-4'>
            {lesson.lessonType === 'VIDEO' && (
              <div className='space-y-2'>
                <h4 className='font-semibold'>Video Content</h4>
                <div className='aspect-video bg-muted rounded-md flex items-center justify-center'>
                  {isLoadingUrl ? (
                    <Icons.spinner className='h-8 w-8 animate-spin' />
                  ) : videoEmbedUrl ? (
                    <iframe
                      src={videoEmbedUrl}
                      title={lesson.lessonName}
                      className='w-full h-full rounded-md'
                      allowFullScreen
                    />
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Video preview not available.
                    </p>
                  )}
                </div>
              </div>
            )}
            {lesson.lessonType === 'TEXT' && (
              <div className='space-y-2'>
                <h4 className='font-semibold'>Text Content</h4>
                <div
                  className='border rounded-md p-4 prose prose-sm dark:prose-invert max-w-none'
                  dangerouslySetInnerHTML={{
                    __html: lesson.textContent || '<p>No content.</p>',
                  }}
                />
              </div>
            )}
            {lesson.lessonType === 'QUIZ' && (
              <div className='space-y-2'>
                <h4 className='font-semibold'>Quiz Questions</h4>
                {lesson.questions && lesson.questions.length > 0 ? (
                  <div className='space-y-3'>
                    {lesson.questions.map((q, index) => (
                      <div key={q.questionId} className='p-3 border rounded-md'>
                        <p className='font-medium text-sm'>
                          Q{index + 1}: {q.questionText}
                        </p>
                        <ul className='list-disc pl-5 mt-2 space-y-1'>
                          {q.options.map((opt) => (
                            <li
                              key={opt.optionId}
                              className={`text-xs ${opt.isCorrectAnswer ? 'text-green-600 font-semibold' : 'text-muted-foreground'}`}
                            >
                              {opt.optionText}{' '}
                              {opt.isCorrectAnswer && (
                                <Icons.check className='inline-block ml-1 h-4 w-4' />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    No questions in this quiz.
                  </p>
                )}
              </div>
            )}
            <Separator />
            <div className='flex justify-between text-sm'>
              <div>
                <strong>Duration:</strong>{' '}
                {formatDurationShort(lesson.videoDurationSeconds || 0)}
              </div>
              <div>
                <strong>Previewable:</strong>{' '}
                {lesson.isFreePreview ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline'>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonDetailsDialog;
