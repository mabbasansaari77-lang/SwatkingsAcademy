import { ArrowDown, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { AnnouncementCard } from '../components/cards/AnnouncementCard';
import { CoachCard } from '../components/cards/CoachCard';
import { FixtureBoard, ResultBoard } from '../components/cards/FixtureCards';
import { GalleryGrid } from '../components/cards/GalleryGrid';
import { ProgrammeTile } from '../components/cards/ProgrammeCard';
import { HeroArt } from '../components/graphics/HeroArt';
import { BannerMedia } from '../components/ui/BannerMedia';
import { useBanner } from '../lib/banners';
import { FaqList } from '../components/cards/FaqList';
import { JsonLd } from '../components/ui/JsonLd';
import { faqSchema, organizationSchema, websiteSchema } from '../lib/schema';
import { LinkButton } from '../components/ui/Button';
import { Container, Section } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { paragraphs, telLink, whatsappLink } from '../lib/format';
import {
  fetchAnnouncements,
  fetchCoaches,
  fetchFaqs,
  fetchHomeGallery,
  fetchPastFixtures,
  fetchProgrammes,
  fetchPublicCounts,
  fetchUpcomingFixtures,
} from '../lib/queries';
import { useSettings } from '../lib/settings';
import { useAsync } from '../lib/useAsync';
import { DEFAULT_INTRO, PILLARS } from '../lib/content';
import type { ReactNode } from 'react';

function Hero() {
  const { settings } = useSettings();
  const banner = useBanner('home');
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-navy-900 text-crease">
      {banner ? <BannerMedia banner={banner} /> : <HeroArt />}
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-navy-950/85 via-navy-900/45 to-transparent" aria-hidden="true" />
      <Container className="relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center py-20">
        <div className="max-w-3xl">
          <h1
            id="hero-heading"
            className="animate-rise text-[clamp(3.25rem,10vw,7.5rem)] font-black uppercase leading-[0.88] tracking-tight"
          >
            {settings.hero_headline}
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg text-crease/85 sm:text-xl" style={{ animationDelay: '0.12s' }}>
            {settings.hero_subheading}
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '0.24s' }}>
            <LinkButton to="/register" variant="accent" size="lg">
              Register for Trials
            </LinkButton>
            <LinkButton to="/programmes" variant="outline-light" size="lg">
              Explore Training
            </LinkButton>
          </div>
        </div>
        <a
          href="#intro"
          className="absolute bottom-8 left-4 hidden items-center gap-2 text-sm text-crease/70 hover:text-crease sm:left-6 sm:flex lg:left-8"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" /> Learn about the academy
        </a>
      </Container>
    </section>
  );
}

function Intro() {
  const { settings } = useSettings();
  const counts = useAsync(fetchPublicCounts, [], 'counts');
  const stats = counts.data
    ? [
        { n: counts.data.programmes, label: counts.data.programmes === 1 ? 'Training programme' : 'Training programmes' },
        { n: counts.data.coaches, label: counts.data.coaches === 1 ? 'Coach' : 'Coaches' },
        { n: counts.data.teams, label: counts.data.teams === 1 ? 'Team' : 'Teams' },
      ].filter((s) => s.n > 0)
    : [];
  const text = paragraphs(settings.intro_text);

  return (
    <Section id="intro" tone="light">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <h2 id="intro-heading" className="text-4xl font-extrabold text-navy-900 sm:text-5xl">
            Cricket coaching in Swat, built around the player
          </h2>
          <div className="prose-body mt-6 max-w-2xl text-lg text-charcoal-600">
            {(text.length ? text : [DEFAULT_INTRO]).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link to="/about" className="mt-6 inline-block font-semibold text-navy-800 underline underline-offset-4 hover:text-navy-600">
            More about the academy
          </Link>
        </div>
        {stats.length > 0 && (
          <dl className="grid grid-cols-3 gap-4 border-l-4 border-accent-500 pl-6 lg:grid-cols-1">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-display text-5xl font-black text-navy-800">{s.n}</span>
                  <span className="text-charcoal-600">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Section>
  );
}

function Programmes() {
  const state = useAsync(() => fetchProgrammes(4), [], 'home:programmes');
  return (
    <Section
      id="programmes"
      tone="chalk"
      title="Coaching programmes"
      intro="From first lessons to performance training, with specialist sessions for every discipline."
      action={
        <LinkButton to="/programmes" variant="outline-dark" size="sm">
          All programmes
        </LinkButton>
      }
    >
      <AsyncBlock
        state={state}
        empty={(d) => d.length === 0}
        emptyView={<EmptyState title="Programmes coming soon">Training programmes will be listed here shortly.</EmptyState>}
      >
        {(items) => (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <li key={p.id}>
                <ProgrammeTile programme={p} />
              </li>
            ))}
          </ul>
        )}
      </AsyncBlock>
    </Section>
  );
}

function Philosophy() {
  const { settings } = useSettings();
  const custom = paragraphs(settings.philosophy_text);
  return (
    <Section id="philosophy" tone="dark" title="Our training philosophy">
      {custom.length > 0 && (
        <div className="prose-body mb-10 max-w-2xl text-lg text-sky-100/90">
          {custom.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <li key={p.title} className="border-l-2 border-accent-500 pl-5">
            <h3 className="text-3xl font-extrabold text-accent-300">{p.title}</h3>
            <p className="mt-2 text-sky-100/85">{p.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Coaches() {
  const state = useAsync(() => fetchCoaches(3), [], 'home:coaches');
  if (!state.data?.length) return null;
  return (
    <Section
      id="coaches"
      tone="light"
      title="Meet the coaches"
      action={
        <LinkButton to="/coaches" variant="outline-dark" size="sm">
          All coaches
        </LinkButton>
      }
    >
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {state.data.map((c) => (
          <li key={c.id}>
            <CoachCard coach={c} compact />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Matches() {
  const upcoming = useAsync(() => fetchUpcomingFixtures(3), [], 'home:upcoming');
  const past = useAsync(() => fetchPastFixtures(3), [], 'home:past');
  if (!upcoming.data?.length && !past.data?.length) return null;
  return (
    <section aria-labelledby="matches-heading" className="bg-navy-950 py-16 text-crease sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="matches-heading" className="text-4xl font-extrabold sm:text-5xl">
            Fixtures and results
          </h2>
          <LinkButton to="/fixtures" variant="outline-light" size="sm">
            Full fixture list
          </LinkButton>
        </div>
        <div className="crease-line mt-6 mb-10 text-crease/30" aria-hidden="true" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-2xl font-bold text-accent-300">Upcoming</h3>
            {upcoming.data?.length ? (
              <ul className="space-y-3">
                {upcoming.data.map((f) => (
                  <li key={f.id}>
                    <FixtureBoard fixture={f} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-crease/70">No upcoming fixtures have been announced.</p>
            )}
          </div>
          <div>
            <h3 className="mb-4 text-2xl font-bold text-accent-300">Latest results</h3>
            {past.data?.length ? (
              <ul className="space-y-3">
                {past.data.map((f) => (
                  <li key={f.id}>
                    <ResultBoard fixture={f} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-crease/70">Results will appear here after matches are played.</p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function GalleryPreview() {
  const state = useAsync(() => fetchHomeGallery(8), [], 'home:gallery');
  if (!state.data?.length) return null;
  return (
    <Section
      id="gallery"
      tone="chalk"
      title="From the nets"
      action={
        <LinkButton to="/gallery" variant="outline-dark" size="sm">
          Open the gallery
        </LinkButton>
      }
    >
      <GalleryGrid items={state.data} />
    </Section>
  );
}

function News() {
  const state = useAsync(() => fetchAnnouncements(3), [], 'home:news');
  if (!state.data?.length) return null;
  return (
    <Section
      id="news"
      tone="light"
      title="Latest announcements"
      action={
        <LinkButton to="/news" variant="outline-dark" size="sm">
          All news
        </LinkButton>
      }
    >
      <ul className="grid gap-6 md:grid-cols-3">
        {state.data.map((a) => (
          <li key={a.id}>
            <AnnouncementCard item={a} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Faqs() {
  const state = useAsync(() => fetchFaqs(), [], 'faqs');
  if (!state.data?.length) return null;
  const schema = faqSchema(state.data);
  return (
    <Section
      id="faq"
      tone="chalk"
      title="Questions parents and players ask"
      action={
        state.data.length > 5 ? (
          <LinkButton to="/faq" variant="outline-dark" size="sm">
            All questions
          </LinkButton>
        ) : undefined
      }
    >
      {schema && <JsonLd data={schema} />}
      <div className="max-w-3xl">
        <FaqList faqs={state.data.slice(0, 5)} openFirst />
      </div>
    </Section>
  );
}

function SiteSchema() {
  const { settings } = useSettings();
  const site = websiteSchema(settings.academy_name);
  return <JsonLd data={site ? [organizationSchema(settings), site] : organizationSchema(settings)} />;
}

function RegisterCta() {
  const { settings } = useSettings();
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden bg-accent-500 text-charcoal-950">
      <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -right-10 -top-10 h-72 w-72 text-sky-100 sm:right-10">
        <circle cx="100" cy="100" r="90" fill="currentColor" />
        <path d="M60 40 Q100 100 60 160 M140 40 Q100 100 140 160" stroke="#0369a1" strokeWidth="3" fill="none" strokeDasharray="6 6" />
      </svg>
      <Container className="relative flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 id="cta-heading" className="text-4xl font-black uppercase sm:text-5xl">
            Ready to take guard?
          </h2>
          <p className="mt-3 text-lg">
            {settings.registration_open
              ? 'Register for trials online. It takes about three minutes and we will contact you with the next steps.'
              : 'Registrations are closed at the moment. Send us a message and we will let you know when trials open.'}
          </p>
        </div>
        <LinkButton to={settings.registration_open ? '/register' : '/contact'} variant="navy" size="lg">
          {settings.registration_open ? 'Register for Trials' : 'Contact the academy'}
        </LinkButton>
      </Container>
    </section>
  );
}

function ContactStrip() {
  const { settings } = useSettings();
  const wa = whatsappLink(settings.whatsapp);
  const items = [
    settings.address && { icon: MapPin, label: 'Address', content: <span className="whitespace-pre-line">{settings.address}</span> },
    settings.phone && { icon: Phone, label: 'Phone', content: <a href={telLink(settings.phone)}>{settings.phone}</a> },
    wa && { icon: MessageCircle, label: 'WhatsApp', content: <a href={wa} target="_blank" rel="noopener noreferrer">{settings.whatsapp}</a> },
    settings.email && { icon: Mail, label: 'Email', content: <a href={`mailto:${settings.email}`}>{settings.email}</a> },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; content: ReactNode }[];

  return (
    <Section id="contact" tone="light" title="Visit or contact us">
      <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
        {items.length > 0 ? (
          <dl className="grid gap-6 sm:grid-cols-2">
            {items.map(({ icon: Icon, label, content }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-navy-600" aria-hidden="true" />
                <div>
                  <dt className="text-sm text-charcoal-600">{label}</dt>
                  <dd className="font-semibold text-charcoal-900 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-navy-600">
                    {content}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-lg text-charcoal-600">
            Our address and phone numbers will be published here soon. You can already send us a message online.
          </p>
        )}
        <div className="flex flex-col items-start gap-3">
          {settings.training_schedule && (
            <p className="whitespace-pre-line text-charcoal-600">
              <span className="block font-semibold text-charcoal-900">Training times</span>
              {settings.training_schedule}
            </p>
          )}
          <LinkButton to="/contact" variant="navy">
            Send a message
          </LinkButton>
        </div>
      </div>
    </Section>
  );
}

export default function Home() {
  return (
    <>
      <Seo
        title="Swat Kings Cricket Academy"
        description="Swat Kings Cricket Academy offers cricket coaching in Swat for beginners, youth and developing players. Register for trials and explore our training programmes."
      />
      <SiteSchema />
      <Hero />
      <Intro />
      <Programmes />
      <Philosophy />
      <Coaches />
      <Matches />
      <GalleryPreview />
      <News />
      <Faqs />
      <RegisterCta />
      <ContactStrip />
    </>
  );
}
