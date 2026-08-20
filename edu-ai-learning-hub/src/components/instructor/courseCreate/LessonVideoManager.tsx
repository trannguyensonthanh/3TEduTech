// src/components/instructor/courseCreate/LessonVideoManager.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  useLessonVideoUrl,
  useUploadLessonVideoDirect,
} from '@/hooks/queries/lesson.queries';
import { getYoutubeEmbedUrl, getVimeoEmbedUrl } from '@/utils/video.util';
import { Lesson } from '@/types/common.types';
import { Label } from '@/components/ui/label';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

interface LessonVideoManagerProps {
  lesson: Lesson | null; // Dữ liệu lesson gốc khi edit
  isEditing: boolean;
}

export const LessonVideoManager: React.FC<LessonVideoManagerProps> = ({
  lesson,
  isEditing,
}) => {
  const form = useFormContext();
  const videoFileRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const { mutate: uploadVideoDirect, isPending: isUploading } = useUploadLessonVideoDirect({
    onSuccess: () => {
      toast.success('Đã tải video lên Cloudinary thành công.');
      setVideoFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Tải video lên thất bại.');
      setUploadProgress(0);
    },
  });
  console.log('LessonVideoManager rendered with lesson:', lesson);
  // Fetch signed URL cho Cloudinary video khi edit
  const lessonId = lesson?.lessonId ? Number(lesson.lessonId) : undefined;
  const isCloudinaryVideo =
    lesson?.videoSourceType === 'CLOUDINARY' && lesson?.externalVideoId;
  const { data: signedUrlData, isLoading: isLoadingSignedUrl } =
    useLessonVideoUrl(isEditing && isCloudinaryVideo ? lessonId : undefined);

  // Effect để khởi tạo preview khi dialog mở hoặc dữ liệu thay đổi
  useEffect(() => {
    let url = null;
    if (lesson?.videoSourceType === 'CLOUDINARY' && signedUrlData?.signedUrl) {
      url = signedUrlData.signedUrl;
    } else if (
      lesson?.videoSourceType === 'YOUTUBE' &&
      lesson.externalVideoId
    ) {
      url = getYoutubeEmbedUrl(lesson.externalVideoId);
    } else if (lesson?.videoSourceType === 'VIMEO' && lesson.externalVideoId) {
      url = getVimeoEmbedUrl(lesson.externalVideoId);
    }
    setVideoPreview(url);
  }, [lesson, signedUrlData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        // 500MB
        toast.error('Dung lượng video không được vượt quá 500MB.');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadVideo = () => {
    if (videoFile && lessonId) {
      setUploadProgress(1);
      uploadVideoDirect({
        lessonId,
        file: videoFile,
        onProgress: (percent) => setUploadProgress(percent),
      });
    } else if (!lessonId) {
      toast.error('Vui lòng lưu thông tin bài học trước khi tải video lên!');
    }
  };

  const videoSourceType = form.watch('videoSourceType');
  const externalVideoInput = form.watch('externalVideoInput');

  // Chuẩn bị source cho Plyr preview
  const getPlyrSource = () => {
    console.log(
      'getPlyrSource called with videoSourceType:',
      videoSourceType,
      lesson
    );
    if (videoPreview && videoSourceType === 'CLOUDINARY') {
      return {
        type: 'video' as const,
        sources: [{ src: videoPreview, type: 'video/mp4' }],
      };
    }
    if (
      (videoSourceType === 'YOUTUBE' && lesson?.externalVideoId) ||
      externalVideoInput
    ) {
      return {
        type: 'video' as const,
        sources: [
          {
            src: lesson.externalVideoId || externalVideoInput,
            provider: 'youtube' as const,
          },
        ],
      };
    }
    if (
      (videoSourceType === 'VIMEO' && lesson?.externalVideoId) ||
      externalVideoInput
    ) {
      return {
        type: 'video' as const,
        sources: [
          {
            src: lesson.externalVideoId || externalVideoInput,
            provider: 'vimeo' as const,
          },
        ],
      };
    }
    return null;
  };
  const plyrSource = getPlyrSource();
  const plyrOptions = {
    controls: [
      'play-large',
      'play',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'fullscreen',
    ],
    autoplay: false,
  };
  console.log('Plyr Source:', plyrSource);
  return (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='videoSourceType'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nguồn video</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? 'CLOUDINARY'}
              disabled={isUploading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value='CLOUDINARY'>
                  <Icons.upload className='inline-block h-4 w-4 mr-2' />
                  Tải video lên
                </SelectItem>
                <SelectItem value='YOUTUBE'>
                  <Icons.youtube className='inline-block h-4 w-4 mr-2' />
                  YouTube
                </SelectItem>
                <SelectItem value='VIMEO'>
                  <Icons.video className='inline-block h-4 w-4 mr-2' />
                  Vimeo
                </SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {videoSourceType === 'CLOUDINARY' && (
        <div>
          <Label>Tệp video</Label>
          <input
            type='file'
            ref={videoFileRef}
            onChange={handleFileChange}
            accept='video/*'
            className='hidden'
          />
          <div
            className='mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary'
            onClick={() => !isUploading && videoFileRef.current?.click()}
          >
            {videoPreview && videoPreview.startsWith('blob:') ? (
              <p className='text-sm font-medium text-primary'>{videoFile?.name}</p>
            ) : (
              <>
                <Icons.upload className='h-8 w-8 text-muted-foreground' />
                <p className='mt-2 text-sm text-muted-foreground'>
                  Bấm hoặc kéo thả tệp để tải thẳng lên Cloudinary
                </p>
              </>
            )}
          </div>
          {videoFile && !isUploading && (
            <Button
              type='button'
              onClick={handleUploadVideo}
              disabled={isUploading}
              className='mt-3 w-full'
            >
              <Icons.upload className='mr-2 h-4 w-4' />
              Tải lên ngay
            </Button>
          )}
          {isUploading && (
            <div className='mx-auto mt-4 w-full max-w-sm rounded-xl border border-border bg-muted p-3.5'>
              <div className='flex items-center justify-between text-xs font-semibold text-foreground mb-1.5'>
                <span className='flex items-center gap-1.5'>
                  <Icons.spinner className='h-4 w-4 animate-spin text-primary' />
                  Đang tải thẳng lên đám mây…
                </span>
                <span className='text-primary font-mono font-bold'>{uploadProgress}%</span>
              </div>
              <div className='h-2.5 w-full overflow-hidden rounded-full border border-border bg-background'>
                <div
                  className='h-2.5 rounded-full bg-primary transition-all duration-300'
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className='mt-2 flex items-center justify-center gap-1 text-center font-mono text-[11px] font-medium text-success'>
                <Icons.checkCircle className='h-3 w-3' aria-hidden='true' />
                Truyền thẳng theo thời gian thực, không tốn RAM máy chủ
              </p>
            </div>
          )}
        </div>
      )}

      {(videoSourceType === 'YOUTUBE' || videoSourceType === 'VIMEO') && (
        <FormField
          control={form.control}
          name='externalVideoInput'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Đường dẫn hoặc mã video {videoSourceType}</FormLabel>
              <FormControl>
                <Input
                  placeholder='Dán đường dẫn vào đây…'
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className='mt-4'>
        <Label>Xem trước</Label>
        <AspectRatio
          ratio={16 / 9}
          className='bg-muted mt-2 rounded-md overflow-hidden'
        >
          {isLoadingSignedUrl ? (
            <div className='w-full h-full flex items-center justify-center'>
              <Icons.spinner className='h-8 w-8 animate-spin' />
            </div>
          ) : plyrSource ? (
            <Plyr source={plyrSource} options={plyrOptions} />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-muted-foreground'>
              Bản xem trước video sẽ hiện ở đây.
            </div>
          )}
        </AspectRatio>
      </div>
    </div>
  );
};
