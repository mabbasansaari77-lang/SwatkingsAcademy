import { CalendarClock, MapPin, User, Users } from 'lucide-react';
import { Link } from 'react-router';
import { labelFor, PROGRAMME_CATEGORIES, PROGRAMME_STATUSES } from '../../lib/labels';
import type { Programme } from '../../lib/types';

const statusStyle: Record<string, string> = {
  open: 'bg-sky-100 text-navy-800',
  waitlist: 'bg-accent-300/40 text-accent-700',
  full: 'bg-charcoal-800/10 text-charcoal-800',
  closed: 'bg-charcoal-800/10 text-charcoal-600',
  coming_soon: 'bg-chalk text-charcoal-600 ring-1 ring-charcoal-400/30',
};

export function StatusBadge({ status }: { status: Programme['status'] }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm font-semibold ${statusStyle[status] ?? ''}`}>
      {labelFor(PROGRAMME_STATUSES, status)}
    </span>
  );
}

/** Compact programme tile used on the home page. */
export function ProgrammeTile({ programme }: { programme: Programme }) {
  return (
    <Link
      to={`/programmes#${programme.slug}`}
      className="card-tech group flex h-full flex-col p-6"
    >
      <span className="text-sm font-semibold text-sky-500">{labelFor(PROGRAMME_CATEGORIES, programme.category)}</span>
      <h3 className="mt-2 text-3xl font-extrabold text-navy-900 group-hover:text-navy-700">{programme.name}</h3>
      {programme.summary && <p className="mt-3 flex-1 text-charcoal-600">{programme.summary}</p>}
      <div className="mt-5 flex items-center justify-between gap-3">
        <StatusBadge status={programme.status} />
        <span className="text-sm font-semibold text-navy-800 underline-offset-4 group-hover:underline">Details</span>
      </div>
    </Link>
  );
}

/** Full programme entry used on the programmes page. */
export function ProgrammeDetail({ programme }: { programme: Programme }) {
  const facts = [
    { icon: Users, label: 'Age group', value: programme.age_group },
    { icon: CalendarClock, label: 'Schedule', value: programme.schedule },
    { icon: MapPin, label: 'Location', value: programme.location },
    { icon: User, label: 'Coach', value: programme.coach?.name },
  ].filter((f) => f.value);

  const canRegister = programme.status === 'open' || programme.status === 'waitlist';

  return (
    <article id={programme.slug} className="scroll-mt-28 grid gap-6 border-b border-charcoal-400/25 py-10 md:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="text-sm font-semibold text-sky-500">{labelFor(PROGRAMME_CATEGORIES, programme.category)}</p>
        <h2 className="mt-1 text-4xl font-extrabold text-navy-900">{programme.name}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={programme.status} />
          {programme.spots_available != null && programme.status === 'open' && (
            <span className="text-sm text-charcoal-600">
              {programme.spots_available} {programme.spots_available === 1 ? 'place' : 'places'} available
              {programme.capacity != null && ` of ${programme.capacity}`}
            </span>
          )}
        </div>
      </div>
      <div>
        {programme.summary && <p className="text-lg font-semibold text-charcoal-900">{programme.summary}</p>}
        {programme.description && (
          <p className="mt-3 whitespace-pre-line text-charcoal-600">{programme.description}</p>
        )}
        {facts.length > 0 && (
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" aria-hidden="true" />
                <div>
                  <dt className="text-sm text-charcoal-600">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-md bg-chalk px-4 py-3">
          <p className="flex-1">
            <span className="text-sm text-charcoal-600">Fees: </span>
            <span className="font-semibold">{programme.fee_text || 'Contact us for details'}</span>
          </p>
          {canRegister && (
            <Link
              to={`/register?programme=${programme.id}`}
              className="font-semibold text-navy-800 underline underline-offset-4 hover:text-navy-600"
            >
              Register for this programme
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
