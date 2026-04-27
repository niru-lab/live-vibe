import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global edge-swipe-back gesture (iOS/Android style).
 * - Triggers only when touch starts in the left ~24px edge of the screen.
 * - Requires a clearly horizontal rightward swipe (>72px and ratio > 1.4).
 * - Calls onSwipe (default: navigate(-1)).
 */
export function useSwipeBack(options?: { onSwipe?: () => void; disabled?: boolean }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (options?.disabled) return;

    let startX: number | null = null;
    let startY: number | null = null;
    let startedFromEdge = false;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startedFromEdge = t.clientX <= 24;
      if (!startedFromEdge) return;
      startX = t.clientX;
      startY = t.clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!startedFromEdge || startX === null || startY === null) {
        startX = startY = null;
        startedFromEdge = false;
        return;
      }
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (dx > 72 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (options?.onSwipe) options.onSwipe();
        else navigate(-1);
      }
      startX = startY = null;
      startedFromEdge = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate, options?.onSwipe, options?.disabled]);
}
