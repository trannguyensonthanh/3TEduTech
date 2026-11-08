/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import throttle from 'lodash.throttle';
import 'videojs-youtube';
type VideoSource = {
  src: string;
  type: string;
};

type Props = {
  source: VideoSource;
  srcSub?: string;
  onProgress?: (progress: { playedSeconds: number }) => void;
  onEnded?: () => void;
};

export default function VideoPlayer({
  source,
  srcSub,
  onProgress,
  onEnded,
}: Props) {
  const playerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  /* [SỬA] Giữ callback trong ref.
     Effect bên dưới cố ý chỉ phụ thuộc vào URL video: thêm onProgress/onEnded
     vào mảng phụ thuộc sẽ HỦY VÀ TẠO LẠI player video.js mỗi lần component cha
     render lại (cha hiếm khi bọc chúng trong useCallback). Nhưng để nguyên thì
     các trình xử lý sự kiện giữ mãi phiên bản callback ĐẦU TIÊN — closure cũ.
     Dùng ref giải quyết cả hai: effect không phụ thuộc vào chúng, mà trình xử
     lý vẫn luôn gọi phiên bản mới nhất. */
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onProgressRef.current = onProgress;
    onEndedRef.current = onEnded;
  }, [onProgress, onEnded]);

  useEffect(() => {
    if (!containerRef.current || !source?.src) {
      return;
    }
    // Nếu player đã khởi tạo → chỉ cần đổi source
    if (playerRef.current) {
      playerRef.current.src(source);
      playerRef.current.load();
      playerRef.current.play(); // autoplay nếu cần
      return;
    }

    // Tạo thẻ video-js và gắn vào DOM
    const videoElement = document.createElement('video-js');
    videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
    videoElement.setAttribute('playsinline', 'true');
    containerRef.current.innerHTML = ''; // Clear
    containerRef.current.appendChild(videoElement);

    // Khởi tạo video.js player
    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      sources: [source],
      playbackRates: [0.5, 1, 1.5, 2],
      techOrder: ['youtube', 'html5'],
      tracks: [
        {
          kind: 'subtitles',
          label: 'EngLish',
          src: srcSub, // => file nằm ở: public/subtitles/vietsub.vtt
          srclang: 'vi',
          default: true,
        },
      ],
    });

    playerRef.current = player;

    // Gửi progress mỗi 5s
    const throttledProgress = throttle(() => {
      const progress = {
        playedSeconds: player.currentTime(),
      };
      if (typeof onProgressRef.current === 'function') {
        onProgressRef.current(progress);
      }
    }, 5000);

    player.on('timeupdate', throttledProgress);

    player.on('ended', () => {
      if (typeof onEndedRef.current === 'function') {
        onEndedRef.current();
      }
    });

    // Cleanup khi component bị unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
    // `source` và `srcSub` chỉ được đọc lúc khởi tạo; đổi phụ đề thì nên dựng
    // lại player để danh sách track được cập nhật.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source?.src, srcSub]);

  return source?.src ? (
    <div data-vjs-player>
      <div ref={containerRef} />
    </div>
  ) : (
    <div className='flex items-center justify-center h-full text-gray-500'>
      <p>No video source provided</p>
    </div>
  );
}
