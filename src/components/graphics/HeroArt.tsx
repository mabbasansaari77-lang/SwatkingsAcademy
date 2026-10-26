/**
 * Original SVG illustration: a cricket ground under floodlights, seen from
 * behind the bowler's end, with the path of a delivery drawn on page load.
 * Purely decorative — hidden from screen readers.
 */
export function HeroArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0369a1" />
          <stop offset="0.55" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
        <radialGradient id="glowL" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f4f6f1" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f4f6f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f6f1" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f4f6f1" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="field" cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#2d7a55" />
          <stop offset="0.6" stopColor="#1b5a40" />
          <stop offset="1" stopColor="#0f3a2c" />
        </radialGradient>
        <linearGradient id="strip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9a878" />
          <stop offset="1" stopColor="#8f7f52" />
        </linearGradient>
        <pattern id="mow" width="120" height="900" patternUnits="userSpaceOnUse">
          <rect width="60" height="900" fill="#ffffff" opacity="0.025" />
        </pattern>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />

      {/* Floodlight towers and beams */}
      <g>
        <path d="M150 120 L-120 900 L520 900 Z" fill="url(#cone)" />
        <path d="M1290 120 L920 900 L1560 900 Z" fill="url(#cone)" />
        <rect x="140" y="120" width="8" height="380" fill="#e0f2fe" />
        <rect x="1292" y="120" width="8" height="380" fill="#e0f2fe" />
        <rect x="112" y="96" width="66" height="30" rx="3" fill="#e7f1f9" />
        <rect x="1262" y="96" width="66" height="30" rx="3" fill="#e7f1f9" />
        <circle cx="145" cy="111" r="90" fill="url(#glowL)" />
        <circle cx="1295" cy="111" r="90" fill="url(#glowL)" />
      </g>

      {/* Stands silhouette */}
      <path
        d="M0 470 Q360 400 720 400 Q1080 400 1440 470 L1440 520 Q1080 455 720 455 Q360 455 0 520 Z"
        fill="#0c4a6e"
      />

      {/* Outfield */}
      <ellipse cx="720" cy="900" rx="1100" ry="450" fill="url(#field)" />
      <ellipse cx="720" cy="900" rx="1100" ry="450" fill="url(#mow)" />
      {/* Boundary rope */}
      <ellipse cx="720" cy="900" rx="1040" ry="415" fill="none" stroke="#f4f6f1" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="2 14" />
      {/* 30-yard circle */}
      <ellipse cx="720" cy="900" rx="560" ry="250" fill="none" stroke="#f4f6f1" strokeOpacity="0.18" strokeWidth="2" strokeDasharray="10 14" />

      {/* Pitch strip in perspective */}
      <path d="M690 560 L750 560 L800 900 L640 900 Z" fill="url(#strip)" />
      {/* Far crease and stumps */}
      <line x1="676" y1="580" x2="764" y2="580" stroke="#f4f6f1" strokeWidth="2.5" />
      <line x1="684" y1="572" x2="756" y2="572" stroke="#f4f6f1" strokeWidth="1.5" strokeOpacity="0.7" />
      <g fill="#f4f6f1">
        <rect x="711" y="538" width="3.2" height="36" />
        <rect x="718.4" y="538" width="3.2" height="36" />
        <rect x="725.8" y="538" width="3.2" height="36" />
        <rect x="710" y="535" width="20" height="2.6" fill="#38bdf8" />
      </g>
      {/* Near crease */}
      <line x1="600" y1="840" x2="840" y2="840" stroke="#f4f6f1" strokeWidth="4" />
      <line x1="560" y1="880" x2="880" y2="880" stroke="#f4f6f1" strokeWidth="3" strokeOpacity="0.7" />

      {/* Delivery path: drawn once on load */}
      <path
        d="M752 820 Q760 640 724 640 Q714 641 720 560"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        className="animate-draw"
        opacity="0.9"
      />
      <circle cx="724" cy="640" r="9" fill="none" stroke="#38bdf8" strokeOpacity="0.5" strokeWidth="2" />
      {/* Ball */}
      <g className="animate-rise" style={{ animationDelay: '1.5s' }}>
        <circle cx="720" cy="560" r="8" fill="#b3262b" />
        <path d="M714.5 556 Q720 560 714.5 564 M725.5 556 Q720 560 725.5 564" stroke="#f4f6f1" strokeWidth="1" fill="none" />
      </g>

      {/* Darken the left side so headline text stays readable */}
      <rect width="1440" height="900" fill="url(#sky)" opacity="0.35" />
    </svg>
  );
}
