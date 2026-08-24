// src/components/instructor/courseCreate/MediaTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { getYoutubeEmbedUrl, extractYoutubeId } from '@/utils/video.util';

interface MediaTabProps {
  onThumbnailChange: (file: File | null) => void;
  initialThumbnail: string | null;
  initialIntroVideo: string | null;
  onIntroVideoChange?: (file: File | null) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({
  onThumbnailChange,
  initialThumbnail,
  initialIntroVideo,
  onIntroVideoChange,
}) => {
  const { control, watch, setValue } = useFormContext();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialThumbnail
  );
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  const introVideoUrl = watch('introVideoUrl');
  const embedUrl = introVideoUrl
    ? getYoutubeEmbedUrl(extractYoutubeId(introVideoUrl) || '')
    : null;

  const [introVideoPreview, setIntroVideoPreview] = useState<string | null>(null);
  const introVideoFileRef = useRef<HTMLInputElement>(null);

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('Video must be less than 500MB.');
        return;
      }
      onIntroVideoChange?.(file);
      setIntroVideoPreview(URL.createObjectURL(file));
      // Xóa URL youtube nếu có
      setValue('introVideoUrl', '', { shouldDirty: true });
    }
  };

  const handleCancelVideoChange = () => {
    onIntroVideoChange?.(null);
    setIntroVideoPreview(null);
    if (introVideoFileRef.current) {
      introVideoFileRef.current.value = '';
    }
  };

  // Cập nhật lại preview nếu dữ liệu gốc từ API thay đổi (ví dụ sau khi lưu và refetch)
  useEffect(() => {
    setThumbnailPreview(initialThumbnail);
  }, [initialThumbnail]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB validation
        toast.error('Thumbnail image must be less than 2MB.');
        return;
      }
      // Truyền file lên component cha để quản lý
      onThumbnailChange(file);
      // Tạo preview từ blob URL
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelThumbnailChange = () => {
    onThumbnailChange(null); // Báo cho cha là không có file mới
    setThumbnailPreview(initialThumbnail); // Trả về preview ảnh gốc
    if (thumbnailFileRef.current) {
      thumbnailFileRef.current.value = ''; // Reset file input
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Thumbnail Section */}
      <Card>
        <CardHeader>
          <CardTitle>Course Thumbnail</CardTitle>
          <CardDescription>
            A high-quality image (16:9 ratio) that represents your course.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <input
            type='file'
            ref={thumbnailFileRef}
            onChange={handleFileSelect}
            accept='image/png, image/jpeg'
            className='hidden'
          />
          <AspectRatio
            ratio={16 / 9}
            className='bg-muted rounded-md border overflow-hidden'
          >
            {thumbnailPreview ? (
              <img
                src={thumbnailPreview}
                alt='Thumbnail preview'
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
                <Icons.image className='h-12 w-12' />
                <p className='mt-2 text-sm'>No Thumbnail</p>
              </div>
            )}
          </AspectRatio>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => thumbnailFileRef.current?.click()}
            >
              <Icons.upload className='mr-2 h-4 w-4' />
              {thumbnailPreview ? 'Change Image' : 'Upload Image'}
            </Button>
            {thumbnailPreview && thumbnailPreview.startsWith('blob:') && (
              <Button
                variant='ghost'
                className='text-destructive hover:text-destructive'
                onClick={handleCancelThumbnailChange}
              >
                <Icons.x className='mr-2 h-4 w-4' />
                Cancel Change
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promotional Video Section */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Video</CardTitle>
          <CardDescription>
            Tải lên một video giới thiệu hoặc dán đường dẫn YouTube.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Nút Upload */}
          <input
            type='file'
            ref={introVideoFileRef}
            onChange={handleVideoFileSelect}
            accept='video/mp4, video/mov, video/mkv, video/avi'
            className='hidden'
          />
          <div className='flex flex-wrap gap-2'>
            <Button
              type="button"
              variant='outline'
              onClick={() => introVideoFileRef.current?.click()}
            >
              <Icons.upload className='mr-2 h-4 w-4' />
              {introVideoPreview ? 'Đổi Video Tải Lên' : 'Tải Video Lên (Không lưu lên Cloudinary khi nháp)'}
            </Button>
            {introVideoPreview && (
              <Button
                type="button"
                variant='ghost'
                className='text-destructive hover:text-destructive'
                onClick={handleCancelVideoChange}
              >
                <Icons.x className='mr-2 h-4 w-4' />
                Hủy tải lên
              </Button>
            )}
          </div>
          <FormField
            control={control}
            name='introVideoUrl'
            render={({ field }) => (
              <FormItem>
                <Label htmlFor='intro-video-url'>YouTube Video URL</Label>
                <FormControl>
                  <Input
                    id='intro-video-url'
                    placeholder='https://www.youtube.com/watch?v=...'
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (e.target.value && introVideoPreview) {
                        handleCancelVideoChange(); // Nếu nhập youtube thì bỏ upload
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {introVideoPreview ? (
             <AspectRatio
               ratio={16 / 9}
               className='bg-muted rounded-md overflow-hidden'
             >
               <video
                 src={introVideoPreview}
                 controls
                 className='w-full h-full bg-black'
               />
             </AspectRatio>
          ) : embedUrl ? (
            <AspectRatio
              ratio={16 / 9}
              className='bg-muted rounded-md overflow-hidden'
            >
              <iframe
                src={embedUrl}
                title='Promotional Video Preview'
                className='w-full h-full'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
              />
            </AspectRatio>
          ) : (
            introVideoUrl && (
              <div className='text-sm p-3 bg-destructive/10 text-destructive rounded-md'>
                Invalid or unsupported YouTube URL.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaTab;
