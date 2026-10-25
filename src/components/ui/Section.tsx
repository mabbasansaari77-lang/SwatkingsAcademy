import type { ReactNode } from 'react';

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
  light: 'bg-crease text-charcoal-900',
  chalk: 'bg-chalk text-charcoal-900',
  dark: 'bg-navy-900 text-crease',
};

/** A page section with an optional heading row. The heading sits on a crease line. */
export function Section({ id, title, intro, action, tone = 'light', children, className = '' }: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={`${tones[tone]} py-16 sm:py-20 ${className}`}>
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
            <div className={`crease-line mt-6 ${tone === 'dark' ? 'text-crease/40' : 'text-navy-800/25'}`} aria-hidden="true" />
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}

/** Header band for inner pages. */
export function PageHeader({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-navy-900 text-crease">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-[140%] -translate-y-1/2 text-navy-700/60"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="2" />
        <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 10" />
        <rect x="186" y="110" width="28" height="180" stroke="currentColor" strokeWidth="2" />
      </svg>
      <Container className="relative py-14 sm:py-20">
        <h1 className="max-w-3xl text-5xl font-black uppercase sm:text-6xl lg:text-7xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-sky-100/90 sm:text-xl">{intro}</p>}
        <div className="crease-line mt-8 max-w-xs text-accent-500" aria-hidden="true" />
      </Container>
    </div>
  );
}
