import { useState } from 'react';
import { GalleryGrid } from '../components/cards/GalleryGrid';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { GALLERY_CATEGORIES } from '../lib/labels';
import { fetchGallery } from '../lib/queries';
import { useAsync } from '../lib/useAsync';

export default function Gallery() {
  const state = useAsync(() => fetchGallery());
  const [category, setCategory] = useState('all');
  const available = GALLERY_CATEGORIES.filter((c) => state.data?.some((g) => g.category === c.value));

  return (
    <>
      <Seo
        title="Photo and Video Gallery"
        description="Photos and videos from training sessions, matches and events at Swat Kings Cricket Academy."
      />
      <PageHeader
        page="gallery" title="Gallery" intro="Photos and videos from training, matches and academy events." />
      <Container className="py-12">
        <AsyncBlock
          state={state}
          empty={(d) => d.length === 0}
          emptyView={<EmptyState title="Gallery coming soon">Photos and videos will be added after our sessions.</EmptyState>}
        >
          {(items) => {
            const shown = category === 'all' ? items : items.filter((g) => g.category === category);
            return (
              <>
                {available.length > 1 && (
                  <div role="group" aria-label="Filter gallery" className="mb-8 flex flex-wrap gap-2">
                    {[{ value: 'all', label: 'All' }, ...available].map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        aria-pressed={category === c.value}
                        onClick={() => setCategory(c.value)}
                        className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                          category === c.value
                            ? 'border-navy-800 bg-navy-800 text-crease'
                            : 'border-navy-800/30 text-navy-800 hover:border-navy-800'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <GalleryGrid key={category} items={shown} />
              </>
            );
          }}
        </AsyncBlock>
      </Container>
    </>
  );
}
