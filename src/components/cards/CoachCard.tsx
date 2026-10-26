import { BadgeCheck } from 'lucide-react';
import { mediaUrl } from '../../lib/media';
import type { Coach } from '../../lib/types';

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <div className="flex h-full w-full items-center justify-center bg-navy-800 font-display text-6xl font-black text-accent-300">
      {initials}
    </div>
  );
}

export function CoachCard({ coach, compact = false }: { coach: Coach; compact?: boolean }) {
  const photo = mediaUrl(coach.photo_url);
  return (
    <article className="flex h-full flex-col overflow-hidden bg-white shadow-[0_1px_0_rgb(0_0_0/0.06)]">
      <div className="aspect-[4/5] w-full overflow-hidden bg-navy-900">
        {photo ? (
          <img
            src={photo}
            alt={`${coach.name}, cricket coach at Swat Kings Cricket Academy, Swat`}
            loading="lazy"
            decoding="async"
            width={480}
            height={600}
            className="h-full w-full object-cover"
          />
        ) : (
          <Initials name={coach.name} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-2xl font-extrabold text-navy-900">{coach.name}</h3>
        {coach.role_title && <p className="font-semibold text-accent-700">{coach.role_title}</p>}
        {coach.specialisation && (
          <p className="mt-2 text-sm text-charcoal-600">
            <span className="font-semibold text-charcoal-800">Specialisation:</span> {coach.specialisation}
          </p>
        )}
        {!compact && coach.bio && <p className="mt-3 whitespace-pre-line text-charcoal-600">{coach.bio}</p>}
        {!compact && coach.qualifications && coach.qualifications_verified && (
          <div className="mt-4 border-t border-charcoal-400/25 pt-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-700">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified qualifications
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-charcoal-600">{coach.qualifications}</p>
          </div>
        )}
      </div>
    </article>
  );
}
