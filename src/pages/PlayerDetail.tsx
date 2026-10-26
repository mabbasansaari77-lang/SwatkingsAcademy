import { ArrowLeft, Award, Camera, Shield, Swords, Target } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { GalleryGrid } from '../components/cards/GalleryGrid';
import { Container } from '../components/ui/Section';
import { Seo } from '../components/ui/Seo';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { paragraphs } from '../lib/format';
import { labelFor, PLAYING_ROLES } from '../lib/labels';
import { mediaUrl } from '../lib/media';
import { fetchPlayer } from '../lib/queries';
import { useAsync } from '../lib/useAsync';
import NotFound from './NotFound';

export default function PlayerDetail() {
  const { id = '' } = useParams();
  const state = useAsync(() => fetchPlayer(id), [id], `player:${id}`);

  if (state.loading) {
    return (
      <Container className="py-16">
        <Loading label="Loading player profile" />
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
  const player = state.data;
  if (!player) return <NotFound />;

  const photo = mediaUrl(player.photo_url);
  const role = labelFor(PLAYING_ROLES, player.playing_role);
  const facts = [
    { icon: Shield, label: 'Team', value: player.team?.name },
    { icon: Target, label: 'Playing role', value: role },
    { icon: Swords, label: 'Batting', value: player.batting_style },
    { icon: Swords, label: 'Bowling', value: player.bowling_style },
  ].filter((f) => f.value);
  const bio = paragraphs(player.bio);
  const photos = player.media.filter((m) => m.media_type === 'image').length;
  const videos = player.media.length - photos;

  return (
    <article>
      <Seo
        title={`${player.display_name}${role ? ` — ${role}` : ''}`}
        description={`${player.display_name}${role ? `, ${role.toLowerCase()}` : ''} at Swat Kings Cricket Academy, Mingora, Swat. Cricket player profile, photos and videos.`}
        image={photo}
      />

      <header className="relative overflow-hidden bg-navy-900 text-crease">
        <Container className="relative py-10 sm:py-14">
          <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 hover:text-crease">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All players and teams
          </Link>
          <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-end">
            <div className="h-48 w-48 shrink-0 overflow-hidden rounded-2xl bg-navy-800 ring-4 ring-accent-500 sm:h-56 sm:w-56">
              {photo ? (
                <img src={photo} alt={`${player.display_name}, cricketer at Swat Kings Cricket Academy, Swat`} width={448} height={448} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-8xl font-black text-accent-300">
                  {player.display_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              {role && <p className="text-lg font-semibold text-accent-300">{role}</p>}
              <h1 className="text-5xl font-black uppercase sm:text-7xl">{player.display_name}</h1>
              {player.team?.name && (
                <p className="mt-2 text-lg text-sky-100/90">
                  {player.team.name}
                  {player.team.age_group ? ` — ${player.team.age_group}` : ''}
                </p>
              )}
            </div>
          </div>
        </Container>
      </header>

      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-6">
          {facts.length > 0 && (
            <dl className="space-y-4 rounded-lg bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" aria-hidden="true" />
                  <div>
                    <dt className="text-sm text-charcoal-600">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
          {player.approved_achievements && (
            <div className="rounded-lg border-l-4 border-navy-700 bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold text-navy-900">
                <Award className="h-6 w-6 text-navy-700" aria-hidden="true" /> Achievements
              </h2>
              <p className="mt-3 whitespace-pre-line text-charcoal-800">{player.approved_achievements}</p>
            </div>
          )}
        </aside>

        <div className="space-y-10">
          {bio.length > 0 && (
            <section aria-labelledby="about-player">
              <h2 id="about-player" className="text-3xl font-extrabold text-navy-900">
                About {player.display_name}
              </h2>
              <div className="prose-body mt-3 text-lg text-charcoal-800">
                {bio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="player-media">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="player-media" className="text-3xl font-extrabold text-navy-900">
                Photos and videos
              </h2>
              {player.media.length > 0 && (
                <p className="text-sm text-charcoal-600">
                  {photos} {photos === 1 ? 'photo' : 'photos'}, {videos} {videos === 1 ? 'video' : 'videos'}
                </p>
              )}
            </div>
            <div className="crease-line mt-3 mb-6 text-navy-800/25" aria-hidden="true" />
            {player.media.length > 0 ? (
              <GalleryGrid items={player.media} />
            ) : (
              <EmptyState title="No photos or videos yet" icon={<Camera className="h-8 w-8" aria-hidden="true" />}>
                Match and training highlights will be added here.
              </EmptyState>
            )}
          </section>
        </div>
      </Container>
    </article>
  );
}
