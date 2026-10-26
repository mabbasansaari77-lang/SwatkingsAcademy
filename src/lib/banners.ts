import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const BANNER_PAGES = [
  { value: 'home', label: 'Home page (hero)' },
  { value: 'about', label: 'About' },
  { value: 'programmes', label: 'Coaching programmes' },
  { value: 'coaches', label: 'Coaches' },
  { value: 'teams', label: 'Players and teams' },
  { value: 'fixtures', label: 'Fixtures and results' },
  { value: 'news', label: 'News' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'register', label: 'Register for trials' },
  { value: 'contact', label: 'Contact' },
] as const;

export type BannerPage = (typeof BANNER_PAGES)[number]['value'];

export interface PageBanner {
  page: BannerPage;
  media_type: 'image' | 'video';
  storage_path: string;
  alt_text: string;
  updated_at: string;
}

let cache: Promise<Record<string, PageBanner>> | null = null;

/** Loads all page banners once per visit (it is a tiny table). */
export function loadBanners(force = false): Promise<Record<string, PageBanner>> {
  if (!supabase) return Promise.resolve({});
  if (!cache || force) {
    const client = supabase;
    cache = Promise.resolve(client.from('page_banners').select('*')).then(({ data, error }) => {
      if (error || !data) return {};
      return Object.fromEntries((data as PageBanner[]).map((b) => [b.page, b]));
    });
  }
  return cache;
}

/** The banner for one page, or null when none is set (or while loading). */
export function useBanner(page: BannerPage | undefined): PageBanner | null {
  const [banner, setBanner] = useState<PageBanner | null>(null);
  useEffect(() => {
    if (!page) return;
    let active = true;
    loadBanners().then((all) => {
      if (active) setBanner(all[page] ?? null);
    });
    return () => {
      active = false;
    };
  }, [page]);
  return banner;
}
