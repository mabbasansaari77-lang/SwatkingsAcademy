import { ArrowDown, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router';
import { AnnouncementCard } from '../components/cards/AnnouncementCard';
import { CoachCard } from '../components/cards/CoachCard';
import { FixtureBoard, ResultBoard } from '../components/cards/FixtureCards';
import { GalleryGrid } from '../components/cards/GalleryGrid';
import { ProgrammeTile } from '../components/cards/ProgrammeCard';
import { HeroArt, HeroMotion } from '../components/graphics/HeroArt';
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
import { CountUp } from '../components/ui/CountUp';
import { prefersReducedMotion, useReveal } from '../lib/motion';
import { useRef, type PointerEvent, type ReactNode } from 'react';

function Hero() {
  const { settings } = useSettings();
  const banner = useBanner('home');
  const ref = useRef<HTMLElement>(null);
  // Desktop parallax: layers marked .parallax drift with the mouse
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const words = settings.hero_headline.split(/\s+/).filter(Boolean);
  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-space-950 text-crease"
    >
      {banner ? <BannerMedia banner={banner} /> : <HeroArt />}
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-space-950/90 via-space-950/50 to-transparent" aria-hidden="true" />
      <HeroMotion />
      <Container className="relative flex min-h-[calc(100svh-4.5rem)] flex-col justify-center py-20">
        <div className="max-w-3xl">
          {settings.registration_open && (
            <div className="animate-rise mb-6">
              <Link
                to="/register"
                className="border-spin inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-sm font-semibold text-sky-100 transition-colors [--spin-bg:rgb(4_24_47/0.85)] hover:text-white"
              >
                <span className="live-dot" aria-hidden="true" />
                Admissions open: register for trials
              </Link>
            </div>
          )}
          <h1
            id="hero-heading"
            className="animate-rise text-[clamp(3.25rem,10vw,7.5rem)] font-black uppercase leading-[0.88] tracking-tight"
          >
            <span className="tech-label mb-4 block text-accent-300 sm:text-sm">
              {settings.academy_name} · Cricket academy in Swat, Mingora
            </span>
            <span className="neon-glow block">
              {words.map((w, i) => (
                <span key={i}>
                  <span className="word-in" style={{ animationDelay: `${0.15 + i * 0.12}s, 0s` }}>
                    {w}
                  </span>{' '}
                </span>
              ))}
            </span>
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg text-crease/85 sm:text-xl" style={{ animationDelay: '0.12s' }}>
            {settings.hero_subheading}
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: '0.24s' }}>
            <LinkButton to="/register" variant="accent" size="lg">
              Player Registration
            </LinkButton>
            <LinkButton to="/programmes" variant="outline-light" size="lg">
              Explore Training
            </LinkButton>
          </div>
          <ul className="animate-rise mt-10 hidden flex-wrap gap-2.5 text-sm text-sky-100/90 sm:flex" style={{ animationDelay: '0.36s' }}>
            {HERO_CHIPS.map((c) => (
              <li key={c} className="glass rounded-md px-3 py-1.5">
                {c}
              </li>
            ))}
          </ul>
        </div>
        <a
          href="#intro"
          className="absolute bottom-8 left-4 hidden items-center gap-2 text-sm text-crease/70 hover:text-crease sm:left-6 sm:flex lg:left-8"
        >
          <ArrowDown className="animate-float h-4 w-4" aria-hidden="true" /> Learn about the academy
        </a>
      </Container>
    </section>
  );
}

const HERO_CHIPS = ['Kids, youth and adults', 'Batting · Bowling · Fielding', 'Takhtaband, Mingora, Swat'];

const TICKER = [
  'Cricket academy in Swat',
  'Junior cricket coaching',
  'Youth and adult training',
  'Batting, bowling and fielding',
  'Cricket club in Takhtaband, Mingora',
  'Admission and trials',
];

/** Scrolling keyword strip under the hero. Decorative: the same words appear elsewhere on the page. */
function Ticker() {
  const row = TICKER.map((t) => (
    <span key={t} className="flex items-center gap-6 px-6">
      <span>{t}</span>
      <span className="h-1.5 w-1.5 rotate-45 bg-neon" />
    </span>
  ));
  return (
    <div className="marquee overflow-hidden border-y border-neon/30 bg-space-900 py-3 text-sky-100" aria-hidden="true">
      <div className="marquee-track tech-label whitespace-nowrap">
        {row}
        {row}
      </div>
    </div>
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
          <dl className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {stats.map((s) => (
              <div key={s.label} className="card-tech border-spin px-4 py-4 sm:px-5">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block font-tech text-4xl font-bold text-navy-800 sm:text-5xl">
                    <CountUp value={s.n} />
                  </span>
                  <span className="text-sm text-charcoal-600 sm:text-base">{s.label}</span>
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
      title="Cricket coaching programmes in Swat"
      intro="From first lessons for kids to performance training for youth and adult cricketers, with specialist batting, bowling and fielding sessions."
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
      <ul className="grid gap-5 sm:grid-cols-2">
        {PILLARS.map((p, i) => (
          <li key={p.title} className="card-glass p-6">
            <span className="tech-label text-neon" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-2 text-3xl font-extrabold text-accent-300">{p.title}</h3>
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
      title="Meet our cricket coaches"
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
  const ref = useReveal<HTMLElement>();
  if (!upcoming.data?.length && !past.data?.length) return null;
  return (
    <section ref={ref} aria-labelledby="matches-heading" className="tech-surface py-16 text-crease sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="matches-heading" className="text-4xl font-extrabold sm:text-5xl">
            Fixtures and results
          </h2>
          <LinkButton to="/fixtures" variant="outline-light" size="sm">
            Full fixture list
          </LinkButton>
        </div>
        <div className="glow-line mt-6 mb-10" aria-hidden="true" />
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
      title="Cricket training in Swat: from the nets"
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
      title="Cricket academy admission, fees and trials in Swat: your questions"
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
    <section
      aria-labelledby="cta-heading"
      className="animate-gradient relative overflow-hidden bg-[linear-gradient(120deg,#7dd3fc,#38bdf8,#bae6fd,#7dd3fc)] text-charcoal-950"
    >
      <svg aria-hidden="true" viewBox="0 0 200 200" className="animate-float absolute -right-10 -top-10 hidden h-72 w-72 text-sky-100 sm:block sm:right-10">
        <circle cx="100" cy="100" r="90" fill="currentColor" opacity="0.85" />
        <circle cx="100" cy="100" r="98" fill="none" stroke="#0369a1" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="4 8" />
        <path d="M60 40 Q100 100 60 160 M140 40 Q100 100 140 160" stroke="#0369a1" strokeWidth="3" fill="none" strokeDasharray="6 6" />
      </svg>
      <Container className="relative flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 id="cta-heading" className="text-4xl font-black uppercase sm:text-5xl">
            Ready to join a cricket academy in Swat?
          </h2>
          <p className="mt-3 text-lg">
            {settings.registration_open
              ? 'Want to join a cricket academy in Swat? Complete your player registration online with your photo and cricket details for admission and trials. Once the academy approves it, your profile appears on our players page.'
              : 'Registrations are closed at the moment. Send us a message and we will let you know when registrations open.'}
          </p>
        </div>
        <LinkButton to={settings.registration_open ? '/register' : '/contact'} variant="navy" size="lg">
          {settings.registration_open ? 'Player Registration' : 'Contact the academy'}
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
    <Section id="contact" tone="light" title="Visit our cricket academy in Mingora, Swat">
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
        description="Cricket academy in Swat, Pakistan (Takhtaband, Mingora, KPK). Cricket coaching and training for kids, youth and adults. Admission, fees and trials registration online."
      />
      <SiteSchema />
      <Hero />
      <Ticker />
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
