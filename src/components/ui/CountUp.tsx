import { useEffect, useRef, useState } from 'react';
import { canAnimate } from '../../lib/motion';

/** Counts up from 0 to `value` the first time the number scrolls into view. */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || !canAnimate() || value <= 0) return;
    let frame = 0;
    setShown(0);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      setShown(value);
    };
  }, [value, duration]);
  return <span ref={ref}>{shown}</span>;
}
