// src/components/instructor/courseCreate/LessonVideoManager.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
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
  useUpdateLessonVideo,
} from '@/hooks/queries/lesson.queries';
import {
  getYoutubeEmbedUrl,
  extractYoutubeId,
  getVimeoEmbedUrl,
  extractVimeoId,
} from '@/utils/video.util';
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

  const { mutate: uploadVideo, isPending: isUploading } = useUpdateLessonVideo({
    onSuccess: () => {
      toast.success('Video uploaded successfully!');
      setVideoFile(null); // Clear file sau khi upload
    },
    onError: (error) => toast.error(error.message || 'Video upload failed.'),
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
        toast.error('Video file size cannot exceed 500MB.');
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      // Không cần set RHF value ở đây nữa, vì việc upload là một hành động riêng
    }
  };

  const handleUploadVideo = () => {
    if (videoFile && lessonId) {
      uploadVideo({ lessonId, file: videoFile });
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
            <FormLabel>Video Source</FormLabel>
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
                  Upload Video
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
          <Label>Video File</Label>
          <input
            type='file'
            ref={videoFileRef}
            onChange={handleFileChange}
            accept='video/*'
            className='hidden'
          />
          <div
            className='mt-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary'
            onClick={() => videoFileRef.current?.click()}
          >
            {videoPreview && videoPreview.startsWith('blob:') ? (
              <p className='text-sm font-medium'>{videoFile?.name}</p>
            ) : (
              <>
                <Icons.upload className='h-8 w-8 text-muted-foreground' />
                <p className='mt-2 text-sm text-muted-foreground'>
                  Click or drag file to upload
                </p>
              </>
            )}
          </div>
          {videoFile && (
            <Button
              type='button'
              onClick={handleUploadVideo}
              disabled={isUploading}
              className='mt-2'
            >
              {isUploading ? (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icons.upload className='mr-2 h-4 w-4' />
              )}
              Upload Now
            </Button>
          )}
        </div>
      )}

      {(videoSourceType === 'YOUTUBE' || videoSourceType === 'VIMEO') && (
        <FormField
          control={form.control}
          name='externalVideoInput'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{videoSourceType} URL or ID</FormLabel>
              <FormControl>
                <Input
                  placeholder='Paste link here...'
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
        <Label>Preview</Label>
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
              Video preview will appear here.
            </div>
          )}
        </AspectRatio>
      </div>
    </div>
  );
};
