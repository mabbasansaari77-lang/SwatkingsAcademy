import { useLocation } from 'react-router';
import { breadcrumbSchema } from '../../lib/schema';
import { JsonLd } from './JsonLd';

const SITE_NAME = 'Swat Kings Cricket Academy';
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '');

interface SeoProps {
  title: string;
  description: string;
  image?: string | null;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Per-page title and meta tags. React 19 hoists these into <head>.
 * The canonical URL and absolute og:url are added once VITE_SITE_URL is set.
 */
export function Seo({ title, description, image, type = 'website', noindex }: SeoProps) {
  const { pathname } = useLocation();
  const fullTitle = title === SITE_NAME ? `${SITE_NAME} | Cricket Coaching in Swat` : `${title} | ${SITE_NAME}`;
  const canonical = SITE_URL ? `${SITE_URL}${pathname === '/' ? '' : pathname}` : null;
  const ogImage = image ?? (SITE_URL ? `${SITE_URL}/og-image.png` : '/og-image.png');
  const crumbs =
    pathname !== '/' && !noindex
      ? breadcrumbSchema([
          { name: 'Home', path: '/' },
          ...(pathname.startsWith('/news/') ? [{ name: 'News', path: '/news' }] : []),
          ...(pathname.startsWith('/players/') ? [{ name: 'Players and teams', path: '/teams' }] : []),
          { name: title, path: pathname },
        ])
      : null;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {crumbs && <JsonLd data={crumbs} />}
    </>
  );
}
