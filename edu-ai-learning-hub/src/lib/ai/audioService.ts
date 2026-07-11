// src/lib/ai/audioService.ts

let currentAudio: HTMLAudioElement | null = null;

/**
 * Chuyển đổi chuỗi base64 thành một Audio object và phát nó.
 * @param base64String - Chuỗi base64 của file âm thanh (đã bao gồm tiền tố data:audio/wav;base64,).
 * @param onStart - Callback khi bắt đầu phát.
 * @param onEnd - Callback khi kết thúc hoặc lỗi.
 */
export const playBase64Audio = (
  base64String: string,
  onStart?: () => void,
  onEnd?: () => void
): void => {
  // Dừng âm thanh đang phát trước đó
  stopCurrentAudio();

  try {
    const audio = new Audio(base64String);
    currentAudio = audio;

    audio.oncanplaythrough = () => {
      audio.play().catch((e) => {
        console.error('Audio play failed:', e);
        onEnd?.();
      });
    };

    audio.onplay = () => {
      console.log('Audio playback started.');
      onStart?.();
    };

    audio.onended = () => {
      console.log('Audio playback finished.');
      currentAudio = null;
      onEnd?.();
    };

    audio.onerror = (e) => {
      console.error('Error playing audio:', e);
      currentAudio = null;
      onEnd?.();
    };

    // Load audio
    audio.load();
  } catch (error) {
    console.error('Error creating audio from base64:', error);
    onEnd?.();
  }
};

/**
 * Dừng âm thanh đang phát.
 */
export const stopCurrentAudio = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    // Gỡ bỏ các listeners để tránh memory leak
    currentAudio.oncanplaythrough = null;
    currentAudio.onplay = null;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
    console.log('Previous audio stopped.');
  }
};
