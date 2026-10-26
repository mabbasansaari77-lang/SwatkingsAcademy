// Option lists shared by forms, filters and display. Values match the
// CHECK constraints in supabase/migrations — keep them in sync.

export const AGE_GROUPS = [
  { value: 'under_10', label: 'Under 10' },
  { value: 'under_12', label: 'Under 12' },
  { value: 'under_14', label: 'Under 14' },
  { value: 'under_16', label: 'Under 16' },
  { value: 'under_19', label: 'Under 19' },
  { value: 'adult', label: 'Adult (19 and over)' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'New to cricket' },
  { value: 'school', label: 'School or street cricket' },
  { value: 'club', label: 'Club cricket' },
  { value: 'district', label: 'District or regional level' },
  { value: 'higher', label: 'Higher level' },
] as const;

export const SCHEDULES = [
  { value: 'weekday_mornings', label: 'Weekday mornings' },
  { value: 'weekday_evenings', label: 'Weekday evenings' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'flexible', label: 'Flexible' },
] as const;

export const PROGRAMME_CATEGORIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'batting', label: 'Batting' },
  { value: 'bowling', label: 'Bowling' },
  { value: 'wicketkeeping', label: 'Wicketkeeping' },
  { value: 'fielding', label: 'Fielding' },
  { value: 'fitness', label: 'Fitness and agility' },
] as const;

export const PROGRAMME_STATUSES = [
  { value: 'open', label: 'Open for registration' },
  { value: 'waitlist', label: 'Waiting list' },
  { value: 'full', label: 'Full' },
  { value: 'closed', label: 'Closed' },
  { value: 'coming_soon', label: 'Coming soon' },
] as const;

export const FIXTURE_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
] as const;

export const OUTCOMES = [
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'tied', label: 'Tied' },
  { value: 'draw', label: 'Draw' },
  { value: 'no_result', label: 'No result' },
] as const;

export const HOME_AWAY = [
  { value: 'home', label: 'Home' },
  { value: 'away', label: 'Away' },
  { value: 'neutral', label: 'Neutral venue' },
] as const;

export const PLAYING_ROLES = [
  { value: 'batter', label: 'Batter' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all_rounder', label: 'All-rounder' },
  { value: 'wicketkeeper', label: 'Wicketkeeper' },
] as const;

export const ANNOUNCEMENT_CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'trials', label: 'Trials' },
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'training', label: 'Training' },
  { value: 'events', label: 'Events' },
  { value: 'notice', label: 'Notice' },
] as const;

export const GALLERY_CATEGORIES = [
  { value: 'training', label: 'Training' },
  { value: 'matches', label: 'Matches' },
  { value: 'events', label: 'Events' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'awards', label: 'Awards' },
] as const;

export const REGISTRATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
] as const;

type Option = { readonly value: string; readonly label: string };

export function labelFor(options: readonly Option[], value: string | null | undefined): string {
  if (!value) return '';
  return options.find((o) => o.value === value)?.label ?? value;
}

export const BATTING_STYLES = [
  { value: 'Right-hand bat', label: 'Right-hand bat' },
  { value: 'Left-hand bat', label: 'Left-hand bat' },
] as const;

export const BOWLING_STYLES = [
  { value: 'Right-arm fast', label: 'Right-arm fast' },
  { value: 'Right-arm medium', label: 'Right-arm medium' },
  { value: 'Right-arm off-spin', label: 'Right-arm off-spin' },
  { value: 'Right-arm leg-spin', label: 'Right-arm leg-spin' },
  { value: 'Left-arm fast', label: 'Left-arm fast' },
  { value: 'Left-arm medium', label: 'Left-arm medium' },
  { value: 'Left-arm orthodox spin', label: 'Left-arm orthodox spin' },
  { value: 'Left-arm wrist-spin', label: 'Left-arm wrist-spin' },
  { value: 'Does not bowl', label: 'Does not bowl' },
] as const;
