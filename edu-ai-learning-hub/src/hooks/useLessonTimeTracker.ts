import { useEffect, useRef } from 'react';
import { useUpdateLastWatchedPosition } from './queries/progress.queries';

const TRACKING_INTERVAL_MS = 10000; // 10 seconds

/**
 * Tracks the amount of time a user spends actively viewing a lesson.
 * It sends heartbeats to the backend every 10 seconds.
 */
export function useLessonTimeTracker(
  lessonId: number | null,
  isEnabled: boolean
) {
  const { mutate: updatePosition } = useUpdateLastWatchedPosition();
  const lastTrackedTimeRef = useRef<number>(Date.now());
  const accumulatedDeltaRef = useRef<number>(0);

  useEffect(() => {
    if (!lessonId || !isEnabled) return;

    // Reset tracking state on mount or lesson change
    lastTrackedTimeRef.current = Date.now();
    accumulatedDeltaRef.current = 0;

    const intervalId = setInterval(() => {
      // Only track if the document is visible and focused
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - lastTrackedTimeRef.current) / 1000);
        
        // Update last tracked time regardless of whether we send to backend or not
        // to avoid accumulating a huge chunk if they come back from inactive
        lastTrackedTimeRef.current = now;

        if (deltaSeconds > 0) {
          accumulatedDeltaRef.current += deltaSeconds;

          // Send heartbeat every TRACKING_INTERVAL_MS
          if (accumulatedDeltaRef.current >= TRACKING_INTERVAL_MS / 1000) {
            updatePosition({
              lessonId: Number(lessonId),
              position: -1, // -1 tells backend to ignore LastWatchedPosition
              timeSpentDelta: accumulatedDeltaRef.current,
            });
            accumulatedDeltaRef.current = 0;
          }
        }
      } else {
        // If inactive, just update the ref so we don't count inactive time
        lastTrackedTimeRef.current = Date.now();
      }
    }, 1000); // Check every second to be accurate with visibility changes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastTrackedTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [lessonId, isEnabled, updatePosition]);
}
