export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" fill="#0284C7" />
      <path d="M14 22 L22 30 L32 16 L42 30 L50 22 L46 44 H18 Z" fill="#FFFFFF" />
      <rect x="18" y="47" width="28" height="4" rx="2" fill="#FFFFFF" />
      <circle cx="32" cy="35" r="5" fill="#B3262B" />
      <path
        d="M28.5 32.5 Q32 35 28.5 37.5 M35.5 32.5 Q32 35 35.5 37.5"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      <span className="leading-none">
        <span className={`block font-display text-2xl font-black uppercase tracking-wide ${light ? 'text-crease' : 'text-navy-900'}`}>
          Swat Kings
        </span>
        <span className={`block text-[0.8rem] font-semibold ${light ? 'text-accent-300' : 'text-accent-700'}`}>
          Cricket Academy
        </span>
      </span>
    </span>
  );
}
