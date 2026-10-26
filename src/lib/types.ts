export type ProgrammeCategory =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'batting'
  | 'bowling'
  | 'wicketkeeping'
  | 'fielding'
  | 'fitness';

export type ProgrammeStatus = 'open' | 'waitlist' | 'full' | 'closed' | 'coming_soon';

export interface SiteSettings {
  id: number;
  academy_name: string;
  hero_headline: string;
  hero_subheading: string;
  intro_text: string | null;
  about_text: string | null;
  mission_text: string | null;
  philosophy_text: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  map_url: string | null;
  training_schedule: string | null;
  registration_open: boolean;
  updated_at?: string;
}

export interface Coach {
  id: string;
  name: string;
  role_title: string | null;
  specialisation: string | null;
  bio: string | null;
  qualifications: string | null;
  qualifications_verified: boolean;
  photo_url: string | null;
  is_published: boolean;
  sort_order: number;
}

export interface Programme {
  id: string;
  slug: string;
  name: string;
  category: ProgrammeCategory;
  summary: string | null;
  description: string | null;
  age_group: string | null;
  schedule: string | null;
  location: string | null;
  coach_id: string | null;
  capacity: number | null;
  spots_available: number | null;
  fee_text: string | null;
  status: ProgrammeStatus;
  is_published: boolean;
  sort_order: number;
  coach?: { name: string } | null;
}

export interface Team {
  id: string;
  name: string;
  age_group: string | null;
  description: string | null;
  coach_id: string | null;
  is_published: boolean;
  sort_order: number;
  coach?: { name: string } | null;
}

export interface PlayerProfile {
  id: string;
  team_id: string | null;
  display_name: string;
  playing_role: 'batter' | 'bowler' | 'all_rounder' | 'wicketkeeper' | null;
  batting_style: string | null;
  bowling_style: string | null;
  approved_achievements: string | null;
  bio?: string | null;
  photo_url: string | null;
  consent_confirmed: boolean;
  is_public: boolean;
  sort_order: number;
}

export interface PlayerMedia {
  id: string;
  player_id: string;
  media_type: 'image' | 'video';
  storage_path: string | null;
  youtube_id: string | null;
  caption: string | null;
  alt_text: string;
  sort_order: number;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
}

export type FixtureStatus = 'scheduled' | 'postponed' | 'cancelled' | 'completed' | 'abandoned';

export interface MatchResult {
  id: string;
  fixture_id: string;
  outcome: 'won' | 'lost' | 'tied' | 'draw' | 'no_result';
  our_score: string | null;
  opponent_score: string | null;
  result_summary: string | null;
  scorecard_summary: string | null;
  player_of_match: string | null;
  is_published: boolean;
}

export interface Fixture {
  id: string;
  team_id: string | null;
  tournament: string | null;
  opponent: string;
  venue: string | null;
  match_date: string;
  match_format: string | null;
  home_away: 'home' | 'away' | 'neutral' | null;
  status: FixtureStatus;
  notes: string | null;
  is_published: boolean;
  team?: { name: string } | null;
  result?: MatchResult | MatchResult[] | null;
}

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: 'news' | 'trials' | 'fixtures' | 'training' | 'events' | 'notice';
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  caption: string | null;
  alt_text: string;
  category: 'training' | 'matches' | 'events' | 'facilities' | 'awards';
  media_type: 'image' | 'video';
  storage_path: string | null;
  youtube_id: string | null;
  is_published: boolean;
  featured?: boolean;
  sort_order: number;
  created_at: string;
}

export type RegistrationStatus = 'pending' | 'contacted' | 'accepted' | 'rejected';

export interface Registration {
  id: string;
  reference: string;
  player_name: string;
  guardian_name: string | null;
  age_group: string;
  phone: string;
  email: string | null;
  programme_id: string | null;
  experience_level: string;
  experience_details: string | null;
  preferred_schedule: string;
  additional_info: string | null;
  guardian_consent: boolean;
  privacy_acknowledged: boolean;
  status: RegistrationStatus;
  admin_notes: string | null;
  playing_role: string | null;
  batting_style: string | null;
  bowling_style: string | null;
  achievements: string | null;
  about_player: string | null;
  photo_paths: string[] | null;
  public_profile_consent: boolean | null;
  player_profile_id: string | null;
  created_at: string;
  programme?: { name: string } | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type ReviewRelationship = 'parent' | 'player' | 'former_player' | 'visitor' | 'other';
export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface Review {
  id: string;
  name: string;
  relationship: ReviewRelationship;
  rating: number;
  comment: string;
  status: ReviewStatus;
  approved_at: string | null;
  created_at: string;
}
