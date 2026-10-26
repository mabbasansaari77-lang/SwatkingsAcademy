-- =====================================================================
-- Swat Kings Cricket Academy — extra keyword FAQs (October 2026)
-- Adds answers for popular Pakistan cricket searches found with Ubersuggest
-- ("how to join cricket academy", "cricket trials", "cricket academy near me",
-- "cricket academy for kids"). Run once in Supabase → SQL Editor.
-- Safe to run more than once: a question is skipped if it already exists.
-- Edit any answer later in Admin → FAQs.
-- =====================================================================

insert into public.faqs (question, answer, is_published, sort_order)
select q, a, true, o
from (values
  ('How do I join a cricket academy in Swat?',
   'Fill in the online Player Registration form on our website with your photo and cricket details. The academy reviews it and contacts you by WhatsApp, SMS or email about admission. The admission fee is PKR 3,000 and the monthly fee is PKR 1,500. There is no payment online.',
   8),
  ('Do you hold cricket trials in Swat?',
   'Yes. To be considered for trials, complete the online Player Registration form. Trial and admission dates are announced on our News page, and registered players are contacted directly.',
   9),
  ('Is there a cricket academy near me in Mingora?',
   'Swat Kings Cricket Academy is in Takhtaband, Mingora, Swat, Khyber Pakhtunkhwa. Players from Mingora and across Swat are welcome. See the Contact page for the address and map.',
   10),
  ('Is there a cricket academy for kids in Swat?',
   'Yes. We coach kids from under-10 age groups up to youth and adult players. Players under 19 need consent from a parent or guardian to register.',
   11)
) as v(q, a, o)
where not exists (select 1 from public.faqs f where lower(f.question) = lower(v.q));
