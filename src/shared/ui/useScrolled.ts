import { useEffect, useState } from 'react';

const DEFAULT_THRESHOLD_PX = 8;

/** Lazy initial read, effect only subscribes — the same shape as useReducedMotion (CODESTYLE §6). */
export function useScrolled(threshold = DEFAULT_THRESHOLD_PX): boolean {
  const [scrolled, setScrolled] = useState(() =>
    typeof window === 'undefined' ? false : window.scrollY > threshold,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
