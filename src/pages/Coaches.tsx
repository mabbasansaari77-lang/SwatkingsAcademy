import { CoachCard } from '../components/cards/CoachCard';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { fetchCoaches } from '../lib/queries';
import { useAsync } from '../lib/useAsync';

export default function Coaches() {
  const state = useAsync(() => fetchCoaches(), [], 'coaches');
  return (
    <>
      <Seo
        title="Coaches"
        description="Meet the coaches providing junior and youth cricket coaching at Swat Kings Cricket Academy, Mingora, Swat."
      />
      <PageHeader
        page="coaches"
        title="Our coaches"
        intro="The people who run our sessions. Qualifications are listed only after the academy has verified them."
      />
      <Container className="py-12">
        <AsyncBlock
          state={state}
          empty={(d) => d.length === 0}
          emptyView={<EmptyState title="Coach profiles coming soon">Our coaching team will be introduced here shortly.</EmptyState>}
        >
          {(coaches) => (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c) => (
                <li key={c.id}>
                  <CoachCard coach={c} />
                </li>
              ))}
            </ul>
          )}
        </AsyncBlock>
      </Container>
    </>
  );
}
