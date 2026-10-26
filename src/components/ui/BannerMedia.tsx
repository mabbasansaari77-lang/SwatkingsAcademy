import { useEffect, useRef } from 'react';
import type { PageBanner } from '../../lib/banners';
import { mediaUrl } from '../../lib/media';

/**
 * Full-bleed background photo or video for a page banner.
 * Videos play muted on loop, and stay paused for visitors who prefer reduced motion.
 */
export function BannerMedia({ banner }: { banner: PageBanner }) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = mediaUrl(banner.storage_path);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) v.pause();
    else void v.play().catch(() => {});
  }, [src]);

  if (!src) return null;
  return banner.media_type === 'video' ? (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-label={banner.alt_text}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <img src={src} alt={banner.alt_text} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
  );
}
