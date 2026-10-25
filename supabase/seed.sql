-- =====================================================================
-- OPTIONAL DEMO DATA — Swat Kings Cricket Academy
--
-- Run this once in the Supabase SQL editor AFTER the migrations if you
-- want the website to show example programmes while you set things up.
--
-- Every record here is clearly marked as DEMO. It contains NO invented
-- coaches, achievements, results, fees, addresses or phone numbers.
-- Edit or delete these rows from the admin dashboard before launch.
-- To remove all demo rows later, run the DELETE statements at the end.
-- =====================================================================

insert into public.programmes (slug, name, category, summary, description, age_group, schedule, location, status, is_published, sort_order)
values
  ('beginner-cricket', 'Beginner Cricket', 'beginner',
   'First steps in cricket: grip, stance, basic batting, bowling and catching.',
   'DEMO CONTENT — replace with your real programme details. A friendly introduction to the game covering safe technique, the laws of cricket and teamwork.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 10),
  ('intermediate-development', 'Intermediate Development', 'intermediate',
   'Build consistency in technique and learn to read match situations.',
   'DEMO CONTENT — replace with your real programme details. For players who know the basics and want structured progression.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 20),
  ('advanced-performance', 'Advanced Performance', 'advanced',
   'High-intensity sessions for players preparing for competitive cricket.',
   'DEMO CONTENT — replace with your real programme details. Match scenarios, video review and individual development plans.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 30),
  ('batting', 'Batting', 'batting',
   'Footwork, shot selection and building an innings.',
   'DEMO CONTENT — replace with your real programme details.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 40),
  ('bowling', 'Bowling', 'bowling',
   'Pace and spin fundamentals with a safe, repeatable action.',
   'DEMO CONTENT — replace with your real programme details.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 50),
  ('wicketkeeping', 'Wicketkeeping', 'wicketkeeping',
   'Stance, glove work, standing up to spin and taking pace.',
   'DEMO CONTENT — replace with your real programme details.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 60),
  ('fielding', 'Fielding', 'fielding',
   'Catching, ground fielding and accurate throwing.',
   'DEMO CONTENT — replace with your real programme details.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 70),
  ('fitness-and-agility', 'Fitness and Agility', 'fitness',
   'Speed, strength and injury-prevention work designed for cricketers.',
   'DEMO CONTENT — replace with your real programme details.',
   'Ages to be confirmed', 'Schedule to be confirmed', 'Location to be confirmed', 'coming_soon', true, 80)
on conflict (slug) do nothing;

insert into public.announcements (slug, title, excerpt, body, category, status, published_at)
values (
  'demo-welcome-to-our-new-website',
  'DEMO: Welcome to our new website',
  'This is a demo announcement. Edit or delete it in Admin → Announcements.',
  'This is demo content created by the seed script so you can see how announcements look.

Replace it with real academy news, such as trial dates or training updates, from the admin dashboard.',
  'news', 'published', now()
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- To remove the demo rows later, run:
--   delete from public.announcements where slug like 'demo-%';
--   delete from public.programmes where description like 'DEMO CONTENT%';
-- ---------------------------------------------------------------------
