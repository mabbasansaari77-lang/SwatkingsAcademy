import { Link } from 'react-router';
import { formatDate } from '../../lib/format';
import { ANNOUNCEMENT_CATEGORIES, labelFor } from '../../lib/labels';
import { mediaUrl } from '../../lib/media';
import type { Announcement } from '../../lib/types';

export function AnnouncementCard({ item }: { item: Announcement }) {
  const cover = mediaUrl(item.cover_image_url);
  return (
    <article className="card-tech group flex h-full flex-col">
      {cover && (
        <div className="aspect-[16/9] overflow-hidden bg-navy-900">
          <img
            src={cover}
            alt={item.cover_image_alt || ''}
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm text-charcoal-600">
          <span className="font-semibold text-sky-500">{labelFor(ANNOUNCEMENT_CATEGORIES, item.category)}</span>
          {item.published_at && (
            <>
              {' '}
              <span aria-hidden="true">/</span> <time dateTime={item.published_at}>{formatDate(item.published_at)}</time>
            </>
          )}
        </p>
        <h3 className="mt-2 text-2xl font-extrabold leading-tight text-navy-900">
          <Link to={`/news/${item.slug}`} className="after:absolute after:inset-0 hover:text-navy-600 focus:outline-none">
            {item.title}
          </Link>
        </h3>
        {item.excerpt && <p className="mt-2 text-charcoal-600">{item.excerpt}</p>}
      </div>
    </article>
  );
}
