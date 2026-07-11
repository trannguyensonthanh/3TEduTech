// src/components/courses/FreePreviewModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Icons } from '@/components/common/Icons'; // Giả sử Icons.play, Icons.fileText tồn tại
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Lesson } from '@/types/common.types'; // Import LessonFE
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries'; // Hook lấy signed URL
import { getYoutubeEmbedUrl, getVimeoEmbedUrl } from '@/utils/video.util';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Video as VideoIcon,
  FileText as TextIcon,
  HelpCircle,
  XCircle,
} from 'lucide-react'; // Dùng lucide
import { Button } from '@/components/ui/button';

interface FreePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null; // Sử dụng LessonFE
}

const FreePreviewModal: React.FC<FreePreviewModalProps> = ({
  isOpen,
  onClose,
  lesson,
}) => {
  const [videoUrlToPlay, setVideoUrlToPlay] = useState<string | null>(null);

  // Fetch signed URL nếu là Cloudinary và có externalVideoId (public_id)
  // Chỉ fetch khi lesson là VIDEO, nguồn là CLOUDINARY và có externalVideoId
  const lessonIdForSignedUrl =
    lesson?.lessonType === 'VIDEO' &&
    lesson?.videoSourceType === 'CLOUDINARY' &&
    lesson?.externalVideoId &&
    lesson?.lessonId // Cần lessonId thật
      ? Number(lesson.lessonId)
      : undefined;

  const {
    data: signedUrlData,
    isLoading,
    isError,
    error,
  } = useLessonVideoUrl(lessonIdForSignedUrl, {
    enabled: !!lessonIdForSignedUrl && isOpen, // Chỉ fetch khi dialog mở và có ID hợp lệ
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset khi dialog đóng
      setVideoUrlToPlay(null);
      return;
    }

    if (lesson?.lessonType === 'VIDEO') {
      if (lesson.videoSourceType === 'CLOUDINARY') {
        if (isLoading) {
          setVideoUrlToPlay('loading');
        } else if (isError) {
          setVideoUrlToPlay('error');
          console.error('Error fetching signed URL for preview:', error);
        } else if (signedUrlData?.signedUrl) {
          setVideoUrlToPlay(signedUrlData.signedUrl);
        } else if (lesson.externalVideoId) {
          // Nếu có externalVideoId nhưng không fetch được (hoặc đang fetch)
          setVideoUrlToPlay('loading'); // Hoặc một trạng thái chờ khác
        } else {
          setVideoUrlToPlay(null); // Không có thông tin
        }
      } else if (
        lesson.videoSourceType === 'YOUTUBE' &&
        lesson.externalVideoId
      ) {
        setVideoUrlToPlay(getYoutubeEmbedUrl(lesson.externalVideoId));
      } else if (lesson.videoSourceType === 'VIMEO' && lesson.externalVideoId) {
        setVideoUrlToPlay(getVimeoEmbedUrl(lesson.externalVideoId));
      } else {
        setVideoUrlToPlay(null); // Trường hợp không có source hợp lệ
      }
    } else {
      setVideoUrlToPlay(null); // Không phải video lesson
    }
  }, [isOpen, lesson, signedUrlData, isLoading, isError, error]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl lg:max-w-5xl p-0">
        <DialogHeader className="p-4 sm:p-6 border-b">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center">
            {lesson?.lessonType === 'VIDEO' ? (
              <VideoIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
            ) : lesson?.lessonType === 'TEXT' ? (
              <TextIcon className="mr-2 h-5 w-5 text-primary shrink-0" />
            ) : lesson?.lessonType === 'QUIZ' ? (
              <HelpCircle className="mr-2 h-5 w-5 text-primary shrink-0" />
            ) : null}
            Free Preview: {lesson?.lessonName || 'Lesson Content'}
          </DialogTitle>
          {lesson?.description && (
            <DialogDescription className="text-sm mt-1">
              {lesson.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {lesson?.lessonType === 'VIDEO' ? (
            videoUrlToPlay === 'loading' ? (
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : videoUrlToPlay === 'error' ? (
              <div className="aspect-video bg-destructive/10 text-destructive rounded-md flex flex-col items-center justify-center">
                <XCircle className="h-10 w-10 mb-2" />
                <p className="font-medium">Could not load video preview.</p>
              </div>
            ) : videoUrlToPlay ? (
              <AspectRatio
                ratio={16 / 9}
                className="bg-black rounded-md overflow-hidden"
              >
                {lesson.videoSourceType === 'CLOUDINARY' ? (
                  <video
                    key={videoUrlToPlay}
                    src={videoUrlToPlay}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  // YouTube or Vimeo
                  <iframe
                    key={videoUrlToPlay}
                    src={videoUrlToPlay}
                    title={`Preview of ${lesson.lessonName}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                )}
              </AspectRatio>
            ) : (
              <div className="aspect-video bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground">
                <VideoIcon className="h-12 w-12 mb-2 opacity-50" />
                <p>Video preview not available.</p>
              </div>
            )
          ) : lesson?.lessonType === 'TEXT' && lesson.textContent ? (
            <ScrollArea className="max-h-[60vh] pr-3">
              {' '}
              {/* Thêm ScrollArea nếu text dài */}
              <div
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.textContent }}
              />
            </ScrollArea>
          ) : lesson?.lessonType === 'QUIZ' ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <HelpCircle className="h-16 w-16 opacity-50 mb-4" />
              <p className="text-center">
                Quizzes are not available for free preview.
              </p>
              <p className="text-xs mt-1">
                Enroll in the course to access quizzes.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Icons.fileText className="h-16 w-16 opacity-50 mb-4" />
              <p className="text-center">
                Preview content not available for this lesson type or is
                missing.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="p-4 sm:p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreePreviewModal;
