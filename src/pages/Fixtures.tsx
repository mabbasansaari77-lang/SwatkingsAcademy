import { useState } from 'react';
import { FixtureBoard, ResultBoard } from '../components/cards/FixtureCards';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { fetchPastFixtures, fetchUpcomingFixtures } from '../lib/queries';
import { useAsync } from '../lib/useAsync';
import { JsonLd } from '../components/ui/JsonLd';
import { fixtureSchemas } from '../lib/schema';
import { useSettings } from '../lib/settings';

type Tab = 'upcoming' | 'results';

export default function Fixtures() {
  const [tab, setTab] = useState<Tab>('upcoming');
  const { settings } = useSettings();
  const upcoming = useAsync(() => fetchUpcomingFixtures(), [], 'fixtures:upcoming');
  const past = useAsync(() => fetchPastFixtures(50), [], 'fixtures:past');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming fixtures' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <>
      <Seo
        title="Fixtures and Results"
        description="Upcoming matches and results for Swat Kings Cricket Academy teams, including tournaments, venues and scorecard summaries."
      />
      {upcoming.data && fixtureSchemas(upcoming.data, settings.academy_name).length > 0 && (
        <JsonLd data={fixtureSchemas(upcoming.data, settings.academy_name)} />
      )}
      <PageHeader
        page="fixtures"
        title="Fixtures and results"
        intro="Match dates, venues and results entered by the academy after each game. Live scores are not available."
      />
      <Container className="py-12">
        <div role="tablist" aria-label="Fixtures and results" className="mb-8 flex gap-1 border-b-2 border-navy-800/15">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`-mb-0.5 border-b-4 px-4 py-3 font-display text-xl font-bold transition-colors ${
                tab === t.id ? 'border-accent-500 text-navy-900' : 'border-transparent text-charcoal-600 hover:text-navy-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="panel-upcoming" aria-labelledby="tab-upcoming" hidden={tab !== 'upcoming'}>
          <AsyncBlock
            state={upcoming}
            empty={(d) => d.length === 0}
            emptyView={<EmptyState title="No upcoming fixtures">New matches will be listed here as soon as they are confirmed.</EmptyState>}
          >
            {(items) => (
              <ul className="grid gap-4 lg:grid-cols-2">
                {items.map((f) => (
                  <li key={f.id}>
                    <FixtureBoard fixture={f} />
                    {f.notes && <p className="mt-2 px-1 text-sm text-charcoal-600">{f.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </AsyncBlock>
        </div>

        <div role="tabpanel" id="panel-results" aria-labelledby="tab-results" hidden={tab !== 'results'}>
          <AsyncBlock
            state={past}
            empty={(d) => d.length === 0}
            emptyView={<EmptyState title="No results yet">Results will be posted here after matches are played.</EmptyState>}
          >
            {(items) => (
              <ul className="grid gap-4 lg:grid-cols-2">
                {items.map((f) => (
                  <li key={f.id}>
                    <ResultBoard fixture={f} detailed />
                  </li>
                ))}
              </ul>
            )}
          </AsyncBlock>
        </div>
      </Container>
    </>
  );
}
