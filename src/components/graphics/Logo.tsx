/** The academy badge. Source file: public/logo.png (transparent PNG). */
export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return <img src="/logo.png" alt="" width={192} height={192} className={`${className} object-contain`} />;
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-12 w-12" />
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
