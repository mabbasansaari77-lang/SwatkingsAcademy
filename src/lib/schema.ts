import type { Announcement, Faq, Fixture, SiteSettings } from './types';

export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, '');

export function absoluteUrl(path: string): string | undefined {
  return SITE_URL ? `${SITE_URL}${path === '/' ? '/' : path}` : undefined;
}

/** schema.org SportsOrganization built only from details the academy has entered. */
export function organizationSchema(s: SiteSettings): Record<string, unknown> {
  const sameAs = [s.facebook_url, s.instagram_url, s.youtube_url, s.tiktok_url].filter(Boolean);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: s.academy_name,
    sport: 'Cricket',
    alternateName: ['Swat Kings', 'Swat Kings Cricket Club'],
    description: 'Cricket academy in Takhtaband, Mingora, Swat, Khyber Pakhtunkhwa, Pakistan, offering cricket coaching and training for kids, youth and adults.',
    areaServed: [
      { '@type': 'City', name: 'Mingora' },
      { '@type': 'AdministrativeArea', name: 'Swat District, Khyber Pakhtunkhwa, Pakistan' },
    ],
    knowsAbout: ['Cricket coaching', 'Batting', 'Bowling', 'Wicketkeeping', 'Fielding', 'Junior cricket', 'Cricket trials'],
    keywords: 'cricket academy in Swat, cricket academy Mingora, cricket coaching Swat, cricket trials Swat, cricket club Takhtaband, cricket academy KPK',
  };
  const url = absoluteUrl('/');
  if (url) {
    data.url = url;
    data.logo = `${SITE_URL}/logo-512.png`;
    data['@id'] = `${SITE_URL}/#organization`;
  }
  if (s.address) data.address = { '@type': 'PostalAddress', streetAddress: s.address, addressLocality: 'Mingora', addressRegion: 'Khyber Pakhtunkhwa', addressCountry: 'PK' };
  if (s.phone) data.telephone = s.phone;
  if (s.email) data.email = s.email;
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

export function websiteSchema(name: string): Record<string, unknown> | null {
  if (!SITE_URL) return null;
  return { '@context': 'https://schema.org', '@type': 'WebSite', name, url: `${SITE_URL}/` };
}

export function faqSchema(faqs: Faq[]): Record<string, unknown> | null {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function articleSchema(a: Announcement, academy: string, image: string | null): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    ...(a.excerpt ? { description: a.excerpt } : {}),
    ...(a.published_at ? { datePublished: a.published_at } : {}),
    ...(image ? { image: [image] } : {}),
    ...(absoluteUrl(`/news/${a.slug}`) ? { mainEntityOfPage: absoluteUrl(`/news/${a.slug}`) } : {}),
    author: { '@type': 'Organization', name: academy },
    publisher: { '@type': 'Organization', name: academy, ...(SITE_URL ? { logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-512.png` } } : {}) },
  };
}

export function fixtureSchemas(fixtures: Fixture[], academy: string): Record<string, unknown>[] {
  return fixtures
    .filter((f) => f.venue)
    .map((f) => ({
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${f.team?.name ?? academy} v ${f.opponent}`,
      sport: 'Cricket',
      startDate: f.match_date,
      eventStatus:
        f.status === 'postponed' ? 'https://schema.org/EventPostponed' : f.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
      location: { '@type': 'Place', name: f.venue, address: f.venue },
      organizer: { '@type': 'SportsOrganization', name: academy },
      competitor: [
        { '@type': 'SportsTeam', name: f.team?.name ?? academy },
        { '@type': 'SportsTeam', name: f.opponent },
      ],
    }));
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Record<string, unknown> | null {
  if (!SITE_URL) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}
