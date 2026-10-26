import { FaqList } from '../components/cards/FaqList';
import { JsonLd } from '../components/ui/JsonLd';
import { LinkButton } from '../components/ui/Button';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { fetchFaqs } from '../lib/queries';
import { faqSchema } from '../lib/schema';
import { useAsync } from '../lib/useAsync';

export default function Faq() {
  const state = useAsync(() => fetchFaqs(), [], 'faqs');
  const schema = state.data ? faqSchema(state.data) : null;
  return (
    <>
      <Seo
        title="Frequently Asked Questions"
        description="Answers to common questions about Swat Kings Cricket Academy: age groups, training and player registration."
      />
      {schema && <JsonLd data={schema} />}
      <PageHeader title="Frequently asked questions" intro="Quick answers about training, registration and joining the academy." />
      <Container className="max-w-3xl py-12">
        <AsyncBlock
          state={state}
          empty={(d) => d.length === 0}
          emptyView={<EmptyState title="Questions coming soon">Have a question now? Send us a message and we will reply.</EmptyState>}
        >
          {(faqs) => <FaqList faqs={faqs} openFirst />}
        </AsyncBlock>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-chalk p-6">
          <p className="text-lg font-semibold text-navy-900">Didn’t find your answer?</p>
          <LinkButton to="/contact" variant="navy">
            Ask the academy
          </LinkButton>
        </div>
      </Container>
    </>
  );
}
