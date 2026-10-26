import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Logo } from '../graphics/Logo';
import { LinkButton } from '../ui/Button';
import { NAV_ITEMS } from '../../lib/nav';

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-neon/20 bg-space-900/85 text-crease shadow-[0_8px_30px_-12px_rgb(2_12_27/0.8)] backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Swat Kings Cricket Academy home" className="shrink-0">
          <Logo light />
        </Link>

        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `relative whitespace-nowrap rounded px-2.5 py-2 text-[0.95rem] font-semibold transition-colors after:absolute after:inset-x-2.5 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-neon after:shadow-[0_0_8px_#38bdf8] after:transition-transform after:duration-300 hover:text-accent-300 hover:after:scale-x-100 ${
                      isActive ? 'text-accent-300 after:scale-x-100' : 'text-crease/90 after:scale-x-0'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <LinkButton to="/register" variant="accent" size="sm" className="whitespace-nowrap">
              Player Registration
            </LinkButton>
          </span>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-crease hover:bg-white/10 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="scroll-progress absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-accent-700 via-neon to-neon-soft" aria-hidden="true" />

      {open && (
        <nav id="mobile-menu" aria-label="Main" className="animate-rise border-t border-white/15 bg-space-900 xl:hidden">
          <ul className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <li>
              <NavLink to="/" end onClick={close} className="block border-b border-white/15 py-3 text-lg font-semibold">
                Home
              </NavLink>
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={close}
                  className={({ isActive }) =>
                    `block border-b border-white/15 py-3 text-lg font-semibold ${isActive ? 'text-accent-300' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-4 pb-2">
              <LinkButton to="/register" variant="accent" className="w-full" onClick={close}>
                Player Registration
              </LinkButton>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
