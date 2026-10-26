import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { ProgrammeDetail } from '../components/cards/ProgrammeCard';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { PROGRAMME_CATEGORIES } from '../lib/labels';
import { fetchProgrammes } from '../lib/queries';
import { useAsync } from '../lib/useAsync';

export default function Programmes() {
  const state = useAsync(() => fetchProgrammes(), [], 'programmes');
  const [filter, setFilter] = useState<string>('all');
  const { hash } = useLocation();

  // Scroll to a programme when arriving from a link like /programmes#batting
  useEffect(() => {
    if (!hash || !state.data) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({ block: 'start' });
  }, [hash, state.data]);

  const available = PROGRAMME_CATEGORIES.filter((c) => state.data?.some((p) => p.category === c.value));

  return (
    <>
      <Seo
        title="Coaching Programmes"
        description="Cricket training programmes in Swat for beginners, intermediate and advanced players, plus batting, bowling, wicketkeeping, fielding and fitness sessions."
      />
      <PageHeader
        page="programmes"
        title="Coaching programmes"
        intro="Choose a programme that matches the player’s level, or focus on a specific skill. Every programme lists its age group, schedule and availability."
      />
      <Container className="py-12">
        <AsyncBlock
          state={state}
          empty={(d) => d.length === 0}
          emptyView={
            <EmptyState title="Programmes coming soon">
              Our programme list is being finalised. Register your interest and we will contact you.
            </EmptyState>
          }
        >
          {(items) => {
            const shown = filter === 'all' ? items : items.filter((p) => p.category === filter);
            return (
              <>
                {available.length > 1 && (
                  <div role="group" aria-label="Filter programmes" className="flex flex-wrap gap-2">
                    {[{ value: 'all', label: 'All' }, ...available].map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={filter === c.value}
                        onClick={() => setFilter(c.value)}
                        className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                          filter === c.value
                            ? 'border-navy-800 bg-navy-800 text-crease'
                            : 'border-navy-800/30 text-navy-800 hover:border-navy-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <div>
                  {shown.map((p) => (
                    <ProgrammeDetail key={p.id} programme={p} />
                  ))}
                </div>
              </>
            );
          }}
        </AsyncBlock>
      </Container>
    </>
  );
}
