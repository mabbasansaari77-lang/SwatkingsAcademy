const STARS = [
  [120, 60, 1.4, 0], [260, 140, 1, 1.2], [410, 50, 1.6, 0.6], [560, 120, 1, 2], [700, 40, 1.3, 1.6],
  [860, 110, 1.1, 0.3], [990, 60, 1.6, 2.4], [1120, 150, 1, 0.9], [1250, 50, 1.4, 1.8], [1380, 120, 1, 0.4],
  [330, 230, 1, 2.2], [820, 220, 1.2, 1.1], [1060, 250, 1, 0.2], [1330, 240, 1.3, 2.8], [190, 300, 1, 1.5],
] as const;

/**
 * Original illustration: a floodlit cricket ground at night drawn as a
 * glowing "hologram", with a moving grid floor, a rotating HUD ring and a
 * delivery that keeps replaying. Purely decorative, hidden from screen
 * readers; all motion stops when the visitor prefers reduced motion.
 */
export function HeroArt() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#020c1b" />
            <stop offset="0.5" stopColor="#04223f" />
            <stop offset="1" stopColor="#075985" />
          </linearGradient>
          <radialGradient id="hero-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hero-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" stopOpacity="0.18" />
            <stop offset="1" stopColor="#bae6fd" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hero-field" cx="0.5" cy="0.2" r="0.8">
            <stop offset="0" stopColor="#0c4a6e" stopOpacity="0.9" />
            <stop offset="1" stopColor="#020c1b" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="hero-strip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0.45" />
          </linearGradient>
          <filter id="hero-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="url(#hero-sky)" />

        {STARS.map(([x, y, r, d]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#e0f2fe" className="animate-twinkle" style={{ animationDelay: `${d}s` }} />
        ))}

        {/* Floodlight towers and beams */}
        <path d="M150 120 L-120 900 L520 900 Z" fill="url(#hero-cone)" />
        <path d="M1290 120 L920 900 L1560 900 Z" fill="url(#hero-cone)" />
        <rect x="143" y="120" width="4" height="380" fill="#38bdf8" opacity="0.5" />
        <rect x="1293" y="120" width="4" height="380" fill="#38bdf8" opacity="0.5" />
        <rect x="112" y="98" width="66" height="26" rx="4" fill="#e0f2fe" />
        <rect x="1262" y="98" width="66" height="26" rx="4" fill="#e0f2fe" />
        <circle cx="145" cy="111" r="110" fill="url(#hero-glow)" />
        <circle cx="1295" cy="111" r="110" fill="url(#hero-glow)" />

        {/* Stands outline */}
        <path d="M0 470 Q360 400 720 400 Q1080 400 1440 470" fill="none" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="2" />
        <path d="M0 520 Q360 455 720 455 Q1080 455 1440 520" fill="none" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="1.5" />

        {/* Outfield as a dark glowing disc */}
        <ellipse cx="720" cy="900" rx="1100" ry="450" fill="url(#hero-field)" />
        <ellipse cx="720" cy="900" rx="1040" ry="415" fill="none" stroke="#7dd3fc" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="3 12" />
        <ellipse cx="720" cy="900" rx="560" ry="250" fill="none" stroke="#38bdf8" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="14 10" />
        <ellipse cx="720" cy="900" rx="560" ry="250" fill="none" stroke="#38bdf8" strokeOpacity="0.25" strokeWidth="8" filter="url(#hero-blur)" />

        {/* Pitch strip drawn as a hologram */}
        <path d="M690 560 L750 560 L800 900 L640 900 Z" fill="url(#hero-strip)" stroke="#7dd3fc" strokeOpacity="0.8" strokeWidth="1.5" />
        <line x1="676" y1="580" x2="764" y2="580" stroke="#e0f2fe" strokeWidth="2.5" />
        <line x1="600" y1="840" x2="840" y2="840" stroke="#e0f2fe" strokeWidth="3" />
        <g fill="#e0f2fe">
          <rect x="711" y="538" width="3.2" height="36" />
          <rect x="718.4" y="538" width="3.2" height="36" />
          <rect x="725.8" y="538" width="3.2" height="36" />
          <rect x="710" y="535" width="20" height="2.6" fill="#38bdf8" />
        </g>

        {/* Delivery path: replays in a loop, with a glow underneath */}
        <path
          d="M752 820 Q760 640 724 640 Q714 641 720 560"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          filter="url(#hero-blur)"
          className="animate-delivery"
        />
        <path
          d="M752 820 Q760 640 724 640 Q714 641 720 560"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1"
          className="animate-delivery"
        />
        <circle cx="724" cy="640" r="10" fill="none" stroke="#38bdf8" strokeOpacity="0.7" strokeWidth="2" />
        <circle cx="720" cy="560" r="16" fill="#b3262b" opacity="0.35" filter="url(#hero-blur)" />
        <circle cx="720" cy="560" r="8" fill="#b3262b" />
        <path d="M714.5 556 Q720 560 714.5 564 M725.5 556 Q720 560 725.5 564" stroke="#f4f6f1" strokeWidth="1" fill="none" />
      </svg>

      {/* Moving perspective grid on the ground */}
      <div className="absolute inset-x-[-25%] bottom-0 h-[45%] [perspective:420px]">
        <div className="absolute inset-0 origin-bottom [transform:rotateX(62deg)] [mask-image:linear-gradient(to_top,#000_10%,transparent_90%)]">
          <div
            className="animate-grid-flow absolute inset-x-0 -top-[60px] bottom-0"
            style={{
              backgroundImage:
                'linear-gradient(rgb(56 189 248 / 0.35) 1.5px, transparent 1.5px), linear-gradient(90deg, rgb(56 189 248 / 0.35) 1.5px, transparent 1.5px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>
      </div>

      {/* Rotating HUD rings on the right */}
      <div className="absolute right-[-9rem] top-[38%] block sm:top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 opacity-60 sm:block md:right-[-12rem] md:h-[36rem] md:w-[36rem] md:opacity-100 lg:right-[-6rem]">
        <div className="parallax h-full w-full" style={{ ['--depth' as string]: '28px' }}>
        <svg viewBox="0 0 400 400" className="animate-spin-slow h-full w-full" fill="none">
          <circle cx="200" cy="200" r="196" stroke="#38bdf8" strokeOpacity="0.25" strokeWidth="1" />
          <circle cx="200" cy="200" r="170" stroke="#7dd3fc" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 10" />
          <path d="M200 30 A170 170 0 0 1 370 200" stroke="#38bdf8" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
          <path d="M200 370 A170 170 0 0 1 30 200" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 400 400" className="absolute inset-[18%] h-[64%] w-[64%] animate-[spin-slow_26s_linear_infinite_reverse]" fill="none">
          <circle cx="200" cy="200" r="190" stroke="#a5f3fc" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="40 18" />
        </svg>
        </div>
      </div>
    </div>
  );
}

// Fixed positions so the server and browser render the same particles
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 2 + ((i * 7) % 4),
  duration: 9 + ((i * 5) % 9),
  delay: -((i * 13) % 17),
}));

/**
 * Motion layer over the hero (works over the illustration or a banner
 * photo): drifting aurora lights, rising particles, and a scanning light band.
 * Decorative only.
 */
export function HeroMotion() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="aurora parallax left-[-10%] top-[5%] h-[28rem] w-[28rem] bg-sky-500" style={{ ['--depth' as string]: '-30px' }} />
      <div
        className="aurora parallax right-[-8%] top-[30%] h-[24rem] w-[24rem] bg-cyan-400"
        style={{ animationDelay: '-6s', ['--depth' as string]: '-45px' }}
      />
      <div className="aurora bottom-[-15%] left-[30%] h-[22rem] w-[30rem] bg-blue-600" style={{ animationDelay: '-11s' }} />
      <div className="scanline" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
