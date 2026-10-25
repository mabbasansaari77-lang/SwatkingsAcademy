import { useState } from 'react';
import { AnnouncementCard } from '../components/cards/AnnouncementCard';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { ANNOUNCEMENT_CATEGORIES } from '../lib/labels';
import { fetchAnnouncements } from '../lib/queries';
import { useAsync } from '../lib/useAsync';

export default function News() {
  const state = useAsync(() => fetchAnnouncements());
  const [category, setCategory] = useState('all');
  const available = ANNOUNCEMENT_CATEGORIES.filter((c) => state.data?.some((a) => a.category === c.value));

  return (
    <>
      <Seo
        title="News and Announcements"
        description="Latest news, trial dates and training announcements from Swat Kings Cricket Academy."
      />
      <PageHeader title="News and announcements" intro="Trial dates, training updates and academy news." />
      <Container className="py-12">
        <AsyncBlock
          state={state}
          empty={(d) => d.length === 0}
          emptyView={<EmptyState title="No announcements yet">News and trial dates will be posted here.</EmptyState>}
        >
          {(items) => {
            const shown = category === 'all' ? items : items.filter((a) => a.category === category);
            return (
              <>
                {available.length > 1 && (
                  <label className="mb-8 flex max-w-xs flex-col gap-1.5 font-semibold">
                    Show
                    <select className="field-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="all">All categories</option>
                      {available.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shown.map((a) => (
                    <li key={a.id}>
                      <AnnouncementCard item={a} />
                    </li>
                  ))}
                </ul>
              </>
            );
          }}
        </AsyncBlock>
      </Container>
    </>
  );
}
