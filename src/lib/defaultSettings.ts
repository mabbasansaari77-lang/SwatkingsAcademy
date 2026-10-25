import type { SiteSettings } from './types';

/** Used until the database responds, or when it is not connected. */
export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  academy_name: 'Swat Kings Cricket Academy',
  hero_headline: 'BUILD YOUR GAME. OWN YOUR FUTURE.',
  hero_subheading:
    'Develop your cricket skills, discipline, confidence, and teamwork with Swat Kings Cricket Academy.',
  intro_text: null,
  about_text: null,
  mission_text: null,
  philosophy_text: null,
  address: null,
  phone: null,
  whatsapp: null,
  email: null,
  facebook_url: null,
  instagram_url: null,
  youtube_url: null,
  tiktok_url: null,
  map_url: null,
  training_schedule: null,
  registration_open: true,
};
