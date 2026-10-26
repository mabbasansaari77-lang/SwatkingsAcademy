import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { Container, PageHeader } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { AsyncBlock, EmptyState } from '../components/ui/States';
import { labelFor, PLAYING_ROLES } from '../lib/labels';
import { mediaUrl } from '../lib/media';
import { fetchTeamsWithPlayers } from '../lib/queries';
import type { PlayerProfile } from '../lib/types';
import { useAsync } from '../lib/useAsync';

function PlayerCard({ player }: { player: PlayerProfile }) {
  const photo = mediaUrl(player.photo_url);
  const styles = [player.batting_style, player.bowling_style].filter(Boolean).join(', ');
  return (
    <Link
      to={`/players/${player.id}`}
      className="group flex h-full gap-4 bg-white p-4 shadow-[0_1px_0_rgb(0_0_0/0.06)] ring-navy-700 transition-shadow hover:ring-2"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-navy-800 ring-2 ring-accent-500">
        {photo ? (
          <img
            src={photo}
            alt={`Photo of ${player.display_name}`}
            loading="lazy"
            width={80}
            height={80}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-3xl font-black text-accent-300">
            {player.display_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-xl font-bold text-navy-900">{player.display_name}</h4>
        {player.playing_role && <p className="text-sm font-semibold text-accent-700">{labelFor(PLAYING_ROLES, player.playing_role)}</p>}
        {styles && <p className="text-sm text-charcoal-600">{styles}</p>}
        {player.approved_achievements && (
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-charcoal-800">{player.approved_achievements}</p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 group-hover:underline">
          View profile, photos and videos <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function Teams() {
  const state = useAsync(fetchTeamsWithPlayers);
  return (
    <>
      <Seo
        title="Players and Teams"
        description="Teams and age groups at Swat Kings Cricket Academy, with approved player profiles."
      />
      <PageHeader title="Players and teams" intro="Our squads and age groups." />
      <Container className="py-12">
        <p className="mb-8 flex max-w-2xl items-start gap-2 text-sm text-charcoal-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          Player profiles appear only with consent and show limited, approved information. We never publish players’
          dates of birth, addresses or contact details.
        </p>
        <AsyncBlock
          state={state}
          empty={(d) => d.teams.length === 0 && d.unassigned.length === 0}
          emptyView={<EmptyState title="Teams coming soon">Our teams and squads will be listed here once they are confirmed.</EmptyState>}
        >
          {({ teams, unassigned }) => (
            <div className="space-y-14">
              {teams.map((team) => (
                <section key={team.id} aria-labelledby={`team-${team.id}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id={`team-${team.id}`} className="text-4xl font-extrabold text-navy-900">
                      {team.name}
                    </h2>
                    <p className="text-charcoal-600">
                      {[team.age_group, team.coach?.name && `Coach: ${team.coach.name}`].filter(Boolean).join(' — ')}
                    </p>
                  </div>
                  <div className="crease-line mt-4 mb-6 text-navy-800/25" aria-hidden="true" />
                  {team.description && <p className="mb-6 max-w-2xl text-charcoal-600">{team.description}</p>}
                  {team.players.length > 0 ? (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {team.players.map((p) => (
                        <li key={p.id}>
                          <PlayerCard player={p} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-charcoal-600">Player profiles for this team have not been published.</p>
                  )}
                </section>
              ))}
              {unassigned.length > 0 && (
                <section aria-labelledby="team-other">
                  <h2 id="team-other" className="text-4xl font-extrabold text-navy-900">
                    Academy players
                  </h2>
                  <div className="crease-line mt-4 mb-6 text-navy-800/25" aria-hidden="true" />
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {unassigned.map((p) => (
                      <li key={p.id}>
                        <PlayerCard player={p} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </AsyncBlock>
      </Container>
    </>
  );
}
