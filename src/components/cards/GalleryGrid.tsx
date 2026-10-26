import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { mediaUrl, youtubeEmbed, youtubeThumb } from '../../lib/media';
import type { GalleryItem } from '../../lib/types';

/** Anything with a photo/video source can be shown: gallery items or player media. */
export type MediaItem = Pick<GalleryItem, 'id' | 'media_type' | 'storage_path' | 'youtube_id' | 'alt_text' | 'caption'> & {
  title?: string | null;
};

function thumbFor(item: MediaItem): string | null {
  if (item.youtube_id) return youtubeThumb(item.youtube_id);
  if (item.media_type === 'image') return mediaUrl(item.storage_path);
  return null;
}

export function GalleryGrid({ items }: { items: MediaItem[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = index != null ? items[index] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current && !dialog.open) dialog.showModal?.();
    if (!current && dialog.open) dialog.close();
  }, [current]);

  const step = (delta: number) =>
    setIndex((i) => (i == null ? i : (i + delta + items.length) % items.length));

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => {
          const thumb = thumbFor(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="group relative block aspect-square w-full overflow-hidden rounded-sm bg-navy-900 text-left"
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.alt_text || 'Cricket training at Swat Kings Cricket Academy, Mingora, Swat'}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={400}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : item.media_type === 'video' && item.storage_path ? (
                  <video
                    src={`${mediaUrl(item.storage_path) ?? ''}#t=0.5`}
                    muted
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center p-4 text-center text-crease/80">
                    {item.title || item.caption || item.alt_text}
                  </span>
                )}
                {(item.caption || item.title) && (
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-navy-950/85 to-transparent px-2 pb-1.5 pt-5 text-left text-xs font-semibold text-crease">
                    {item.title || item.caption}
                  </span>
                )}
                {item.media_type === 'video' && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-950/80 text-crease ring-2 ring-white/70">
                      <Play className="h-6 w-6 translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                )}
                <span className="sr-only">
                  {item.media_type === 'video' ? 'Play video: ' : 'View photo: '}
                  {item.title || item.caption || item.alt_text}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        aria-label={current ? current.title || current.alt_text : 'Gallery viewer'}
        className="m-auto w-[min(96vw,1100px)] bg-transparent p-0 text-crease backdrop:bg-charcoal-950/90"
      >
        {current && (
          <figure className="relative">
            <div className="flex max-h-[80vh] items-center justify-center bg-charcoal-950">
              {current.youtube_id ? (
                <div className="aspect-video w-full">
                  <iframe
                    src={youtubeEmbed(current.youtube_id)}
                    title={current.title || current.alt_text}
                    className="h-full w-full"
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : current.media_type === 'video' ? (
                <video src={mediaUrl(current.storage_path) ?? undefined} controls className="max-h-[80vh] w-full" aria-label={current.alt_text} />
              ) : (
                <img src={mediaUrl(current.storage_path) ?? undefined} alt={current.alt_text || 'Cricket training at Swat Kings Cricket Academy, Mingora, Swat'} className="max-h-[80vh] w-auto object-contain" />
              )}
            </div>
            {(current.title || current.caption) && (
              <figcaption className="bg-charcoal-950 px-4 py-3">
                {current.title && <p className="font-display text-xl font-bold">{current.title}</p>}
                {current.caption && <p className="text-crease/80">{current.caption}</p>}
              </figcaption>
            )}
            <div className="absolute right-2 top-2 flex gap-2">
              {items.length > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} className="rounded-full bg-charcoal-950/80 p-2 hover:bg-charcoal-800">
                    <ChevronLeft aria-hidden="true" />
                    <span className="sr-only">Previous</span>
                  </button>
                  <button type="button" onClick={() => step(1)} className="rounded-full bg-charcoal-950/80 p-2 hover:bg-charcoal-800">
                    <ChevronRight aria-hidden="true" />
                    <span className="sr-only">Next</span>
                  </button>
                </>
              )}
              <button type="button" onClick={() => setIndex(null)} className="rounded-full bg-charcoal-950/80 p-2 hover:bg-charcoal-800">
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </figure>
        )}
      </dialog>
    </>
  );
}
