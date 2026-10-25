import { MapPin, Trophy } from 'lucide-react';
import { dateParts, formatDate, formatDateTime } from '../../lib/format';
import { FIXTURE_STATUSES, HOME_AWAY, labelFor, OUTCOMES } from '../../lib/labels';
import { resultOf } from '../../lib/queries';
import type { Fixture } from '../../lib/types';

/** Upcoming match, styled like a ground scoreboard panel. */
export function FixtureBoard({ fixture }: { fixture: Fixture }) {
  const { day, month, time } = dateParts(fixture.match_date);
  const teamName = fixture.team?.name ?? 'Swat Kings';
  return (
    <article className="scoreboard flex gap-5 rounded-md p-5">
      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-charcoal-800 pr-5 text-center">
        <span className="scoreboard-digit text-4xl leading-none">{day}</span>
        <span className="mt-1 text-sm font-semibold uppercase text-crease/70">{month}</span>
      </div>
      <div className="min-w-0 flex-1">
        {fixture.tournament && <p className="truncate text-sm text-accent-300">{fixture.tournament}</p>}
        <h3 className="mt-0.5 font-display text-2xl font-bold leading-tight">
          {teamName} <span className="text-crease/50">v</span> {fixture.opponent}
        </h3>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-crease/75">
          <span>{time}</span>
          {fixture.venue && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {fixture.venue}
            </span>
          )}
          {fixture.home_away && <span>{labelFor(HOME_AWAY, fixture.home_away)}</span>}
          {fixture.match_format && <span>{fixture.match_format}</span>}
        </p>
        {fixture.status === 'postponed' && (
          <p className="mt-2 inline-block rounded bg-accent-500 px-2 py-0.5 text-sm font-bold text-charcoal-950">
            Postponed
          </p>
        )}
        <span className="sr-only">Starts {formatDateTime(fixture.match_date)}</span>
      </div>
    </article>
  );
}

const outcomeStyle: Record<string, string> = {
  won: 'bg-sky-500 text-white',
  lost: 'bg-charcoal-600 text-white',
  tied: 'bg-accent-500 text-charcoal-950',
  draw: 'bg-accent-500 text-charcoal-950',
  no_result: 'bg-charcoal-400 text-white',
};

/** Past match with its manually entered result, if published. */
export function ResultBoard({ fixture, detailed = false }: { fixture: Fixture; detailed?: boolean }) {
  const result = resultOf(fixture);
  const teamName = fixture.team?.name ?? 'Swat Kings';
  return (
    <article className="scoreboard rounded-md p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-crease/70">
        <span>
          {formatDate(fixture.match_date)}
          {fixture.tournament && ` — ${fixture.tournament}`}
        </span>
        {result ? (
          <span className={`rounded px-2 py-0.5 text-sm font-bold ${outcomeStyle[result.outcome]}`}>
            {labelFor(OUTCOMES, result.outcome)}
          </span>
        ) : (
          <span className="rounded bg-charcoal-800 px-2 py-0.5 text-sm font-semibold">
            {fixture.status === 'completed' ? 'Result to be confirmed' : labelFor(FIXTURE_STATUSES, fixture.status)}
          </span>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2">
        <dt className="truncate font-display text-xl font-bold">{teamName}</dt>
        <dd className="scoreboard-digit text-right text-2xl">{result?.our_score || '—'}</dd>
        <dt className="truncate font-display text-xl font-bold text-crease/85">{fixture.opponent}</dt>
        <dd className="scoreboard-digit text-right text-2xl text-crease/80">{result?.opponent_score || '—'}</dd>
      </dl>
      {result?.result_summary && <p className="mt-3 border-t border-charcoal-800 pt-3 text-crease/85">{result.result_summary}</p>}
      {detailed && result?.player_of_match && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-accent-300">
          <Trophy className="h-4 w-4" aria-hidden="true" /> Player of the match: {result.player_of_match}
        </p>
      )}
      {detailed && result?.scorecard_summary && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-crease hover:text-accent-300">Scorecard summary</summary>
          <p className="mt-2 whitespace-pre-line text-crease/80">{result.scorecard_summary}</p>
        </details>
      )}
      {detailed && fixture.venue && <p className="mt-2 text-sm text-crease/60">Venue: {fixture.venue}</p>}
    </article>
  );
}
