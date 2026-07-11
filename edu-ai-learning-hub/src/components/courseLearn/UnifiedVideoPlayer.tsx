// src/components/courseLearn/SecureVideoPlayer.tsx
import React, {
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import Plyr, { APITypes } from 'plyr-react';
import 'plyr-react/plyr.css';
import { useLessonVideoUrl } from '@/hooks/queries/lesson.queries';
import { useSubtitles } from '@/hooks/queries/subtitle.queries';
import { Lesson } from '@/types/common.types';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/common/Icons';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface SecureVideoPlayerProps {
  lesson: Lesson & { lastPositionWatched?: number }; // Thêm lastPositionWatched từ CourseLearningPage
  onTimeUpdate: (currentTime: number) => void;
  onEnded: () => void;
}

// Plyr-react không forwardRef mặc định, chúng ta cần tạo một wrapper để truy cập instance
const PlyrWrapper = forwardRef<APITypes, React.ComponentProps<typeof Plyr>>(
  (props, ref) => {
    const innerRef = useRef<APITypes>(null);
    useImperativeHandle(ref, () => innerRef.current as APITypes, []);
    return <Plyr ref={innerRef} {...props} />;
  }
);
PlyrWrapper.displayName = 'PlyrWrapper';

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  lesson,
  onTimeUpdate,
  onEnded,
}) => {
  const plyrInstanceRef = useRef<APITypes | null>(null);
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

  // Build tracks only for Cloudinary
  const tracks = useMemo(() => {
    if (lesson.videoSourceType !== 'CLOUDINARY') return undefined;
    return (
      subtitlesData?.subtitles.map((sub) => ({
        kind: 'captions' as const,
        label: sub.languageName || sub.languageCode.toUpperCase(),
        srcLang: sub.languageCode,
        src: sub.subtitleUrl,
        default: sub.isDefault,
      })) || []
    );
  }, [subtitlesData, lesson.videoSourceType]);
  console.log('tracks:', tracks);
  const videoSource = useMemo<Plyr.SourceInfo | null>(() => {
    switch (lesson.videoSourceType) {
      case 'CLOUDINARY':
        if (!videoUrlData?.signedUrl) return null;
        return {
          type: 'video',
          title: lesson.lessonName,
          sources: [{ src: videoUrlData.signedUrl, type: 'video/mp4' }],
          poster: lesson.thumbnailUrl || undefined,
          tracks,
          crossorigin: true,
        };
      case 'YOUTUBE':
        if (!lesson.externalVideoId) return null;
        return {
          type: 'video',
          sources: [
            {
              src: videoUrlData?.publicEmbedUrl,
              provider: 'youtube',
            },
          ],
        };
      case 'VIMEO':
        if (!lesson.externalVideoId) return null;
        return {
          type: 'video',
          sources: [
            {
              src: videoUrlData?.publicEmbedUrl,
              provider: 'vimeo',
            },
          ],
        };
      default:
        return null;
    }
  }, [videoUrlData, tracks, lesson]);

  const plyrOptions: Plyr.Options = {
    controls: [
      'play-large',
      'restart',
      'rewind',
      'play',
      'fast-forward',
      'progress',
      'current-time',
      'duration',
      'mute',
      'volume',
      'captions',
      'settings',
      'pip',
      'airplay',
      'fullscreen',
    ],
    settings: ['captions', 'quality', 'speed', 'loop'],
    captions: { active: true, language: 'auto', update: true },
    autoplay: true, // Thêm autoplay để người dùng không cần click thêm
    // ...các tùy chọn khác
  };

  // Plyr instance type (tối giản, chỉ lấy currentTime)
  type PlyrNativeInstance = {
    currentTime: number;
  };

  useEffect(() => {
    const player = plyrInstanceRef.current?.plyr as
      | PlyrNativeInstance
      | undefined;
    if (
      player &&
      lesson.lastPositionWatched &&
      lesson.lastPositionWatched > 1 &&
      player.currentTime < 1
    ) {
      player.currentTime = lesson.lastPositionWatched;
    }
  }, [videoSource, lesson.lastPositionWatched]);

  if (isLoadingUrl || isLoadingSubtitles) {
    return (
      <div style={{ aspectRatio: '16/9', width: '100%' }}>
        <Skeleton className='w-full h-full flex items-center justify-center bg-muted'>
          <Icons.spinner className='h-10 w-10 animate-spin text-primary' />
        </Skeleton>
      </div>
    );
  }

  if (isUrlError || !videoSource) {
    return (
      <div style={{ aspectRatio: '16/9', width: '100%' }}>
        <div className='w-full h-full flex flex-col items-center justify-center bg-destructive/10 text-destructive'>
          <Icons.alertTriangle className='h-12 w-12 mb-2' />
          <p className='font-semibold'>Could not load video.</p>
          <p className='text-sm'>The video source is currently unavailable.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ aspectRatio: '16/9', width: '100%', background: 'black' }}>
      <PlyrWrapper
        key={lesson.lessonId + '-' + lesson.videoSourceType}
        ref={plyrInstanceRef}
        source={videoSource}
        options={plyrOptions}
        onTimeUpdate={(e) => {
          const plyr = (
            e as unknown as { detail?: { plyr?: PlyrNativeInstance } }
          ).detail?.plyr;
          if (plyr && typeof plyr.currentTime === 'number') {
            onTimeUpdate(plyr.currentTime);
          }
        }}
        onEnded={onEnded}
      />
    </div>
  );
};

export default SecureVideoPlayer;
