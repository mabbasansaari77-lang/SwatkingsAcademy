import { useCallback, useRef } from 'react';

/** True when the browser can animate and the visitor has not asked for reduced motion. */
export function canAnimate(): boolean {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return false;
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fades an element in as it scrolls into view. Only elements that start
 * below the screen are hidden, and only after the page has loaded, so the
 * pre-rendered HTML (what search engines read) always shows everything.
 * Returns a callback ref, so it also works for elements that appear later.
 */
export function useReveal<T extends HTMLElement>() {
  const cleanup = useRef<() => void>(undefined);
  return useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = undefined;
    if (!el || !canAnimate()) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('reveal');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.classList.add('reveal-in');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    cleanup.current = () => io.disconnect();
  }, []);
}
