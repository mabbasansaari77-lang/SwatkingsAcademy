import type { ReactNode } from 'react';
import { useBanner, type BannerPage } from '../../lib/banners';
import { BannerMedia } from './BannerMedia';
import { useReveal } from '../../lib/motion';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

interface SectionProps {
  id?: string;
  title?: string;
  intro?: ReactNode;
  action?: ReactNode;
  tone?: 'light' | 'chalk' | 'dark';
  children: ReactNode;
  className?: string;
}

const tones = {
  light: 'on-sky bg-skybg text-charcoal-900',
  chalk: 'on-sky bg-skybg-soft text-charcoal-900',
  dark: 'tech-surface text-crease',
};

/** A page section with an optional heading row. The heading sits on a crease line. */
export function Section({ id, title, intro, action, tone = 'light', children, className = '' }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  const reveal = useReveal<HTMLElement>();
  return (
    <section ref={reveal} id={id} aria-labelledby={title ? headingId : undefined} className={`${tones[tone]} py-16 sm:py-20 ${className}`}>
      <Container>
        {title && (
          <header className="mb-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 id={headingId} className="text-4xl font-extrabold sm:text-5xl">
                  {title}
                </h2>
                {intro && (
                  <p className={`mt-3 text-lg ${tone === 'dark' ? 'text-sky-100/85' : 'text-charcoal-600'}`}>{intro}</p>
                )}
              </div>
              {action}
            </div>
            <div className="glow-line mt-6" aria-hidden="true" />
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

/** Header band for inner pages. Shows the page's banner photo/video when one is set in the admin. */
export function PageHeader({ title, intro, page }: { title: string; intro?: ReactNode; page?: BannerPage }) {
  const banner = useBanner(page);
  return (
    <div className="tech-surface relative overflow-hidden text-crease">
      {banner ? (
        <>
          <BannerMedia banner={banner} />
          <div className="absolute inset-0 bg-gradient-to-r from-space-950/90 via-space-900/70 to-space-900/30" aria-hidden="true" />
        </>
      ) : (
        <svg
          aria-hidden="true"
          className="animate-spin-slow pointer-events-none absolute -right-24 top-[-20%] h-[140%] text-neon/40"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="2" />
          <path d="M200 10 A190 190 0 0 1 390 200" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" />
          <rect x="186" y="110" width="28" height="180" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
      <Container className={`relative ${banner ? 'py-20 sm:py-28' : 'py-14 sm:py-20'}`}>
        <h1 className="text-hologram neon-glow animate-rise max-w-3xl text-5xl font-black uppercase sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-sky-100/95 sm:text-xl">{intro}</p>}
        <div className="glow-line mt-8 max-w-xs" aria-hidden="true" />
      </Container>
    </div>
  );
}
