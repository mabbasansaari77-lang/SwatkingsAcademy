import { LinkButton } from '../components/ui/Button';
import { PageHeader, Section } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { DEFAULT_INTRO, PILLARS } from '../lib/content';
import { paragraphs } from '../lib/format';
import { useSettings } from '../lib/settings';

export default function About() {
  const { settings } = useSettings();
  const about = paragraphs(settings.about_text);
  const mission = paragraphs(settings.mission_text);
  const philosophy = paragraphs(settings.philosophy_text);

  return (
    <>
      <Seo
        title="About the Academy"
        description="About Swat Kings Cricket Academy, a cricket academy and club in Takhtaband, Mingora, Swat offering junior and youth cricket coaching."
      />
      <PageHeader
        page="about"
        title="About the academy"
        intro="Who we are, what we believe in, and how we help cricketers in Swat develop their game."
      />

      <Section tone="light">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="text-4xl font-extrabold text-navy-900">Our story</h2>
            <div className="prose-body mt-5 max-w-2xl text-lg text-charcoal-600">
              {(about.length ? about : [DEFAULT_INTRO]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {mission.length > 0 && (
            <aside className="self-start border-l-4 border-accent-500 bg-chalk p-6">
              <h2 className="text-3xl font-extrabold text-navy-900">Our mission</h2>
              <div className="prose-body mt-3 text-charcoal-600">
                {mission.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </aside>
          )}
        </div>
      </Section>

      <Section tone="dark" title="What we develop in every player">
        {philosophy.length > 0 && (
          <div className="prose-body mb-10 max-w-2xl text-lg text-sky-100/90">
            {philosophy.map((p, i) => (
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

      <Section tone="light">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xl font-semibold text-charcoal-900">
            Want to see how we train? Look through our programmes or complete a player registration.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/programmes" variant="outline-dark">
              Explore Training
            </LinkButton>
            <LinkButton to="/register" variant="accent">
              Player Registration
            </LinkButton>
          </div>
        </div>
      </Section>
    </>
  );
}
