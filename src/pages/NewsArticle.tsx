import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Container } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { ErrorState, Loading } from '../components/ui/States';
import { formatDate, paragraphs } from '../lib/format';
import { ANNOUNCEMENT_CATEGORIES, labelFor } from '../lib/labels';
import { mediaUrl } from '../lib/media';
import { fetchAnnouncement } from '../lib/queries';
import { useAsync } from '../lib/useAsync';
import NotFound from './NotFound';

export default function NewsArticle() {
  const { slug = '' } = useParams();
  const state = useAsync(() => fetchAnnouncement(slug), [slug]);

  if (state.loading) {
    return (
      <Container className="py-16">
        <Loading label="Loading article" />
      </Container>
    );
  }
  if (state.error) {
    return (
      <Container className="py-16">
        <ErrorState error={state.error} onRetry={state.reload} />
      </Container>
    );
  }
  const article = state.data;
  if (!article) return <NotFound />;

  const cover = mediaUrl(article.cover_image_url);
  return (
    <article>
      <Seo
        title={article.title}
        description={article.excerpt || `${article.title} — news from Swat Kings Cricket Academy.`}
        image={cover}
        type="article"
      />
      <header className="bg-navy-900 text-crease">
        <Container className="max-w-3xl py-14">
          <Link to="/news" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 hover:text-accent-500">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All news
          </Link>
          <p className="mt-6 text-sm text-sky-100/80">
            <span className="font-semibold text-accent-300">{labelFor(ANNOUNCEMENT_CATEGORIES, article.category)}</span>
            {article.published_at && (
              <>
                {' '}
                <span aria-hidden="true">/</span> <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
              </>
            )}
          </p>
          <h1 className="mt-3 text-5xl font-black sm:text-6xl">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-xl text-sky-100/90">{article.excerpt}</p>}
        </Container>
      </header>
      <Container className="max-w-3xl py-12">
        {cover && (
          <img
            src={cover}
            alt={article.cover_image_alt || ''}
            width={1200}
            height={675}
            className="mb-10 aspect-[16/9] w-full object-cover"
          />
        )}
        <div className="prose-body text-lg leading-relaxed text-charcoal-800">
          {paragraphs(article.body).map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </Container>
    </article>
  );
}
