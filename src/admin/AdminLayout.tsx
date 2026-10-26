import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  HelpCircle,
  Image,
  ImageUp,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { LogoMark } from '../components/graphics/Logo';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/registrations', label: 'Registrations', icon: ClipboardList },
  { to: '/admin/messages', label: 'Messages', icon: Inbox },
  { to: '/admin/programmes', label: 'Programmes', icon: Shield },
  { to: '/admin/coaches', label: 'Coaches', icon: User },
  { to: '/admin/teams', label: 'Teams', icon: Users },
  { to: '/admin/players', label: 'Player profiles', icon: User },
  { to: '/admin/fixtures', label: 'Fixtures', icon: CalendarDays },
  { to: '/admin/results', label: 'Results', icon: Trophy },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/faqs', label: 'FAQ', icon: HelpCircle },
  { to: '/admin/gallery', label: 'Gallery', icon: Image },
  { to: '/admin/banners', label: 'Page banners', icon: ImageUp },
  { to: '/admin/settings', label: 'Website settings', icon: Settings },
];

export function AdminLayout() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin">
      <ul className="space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-[0.95rem] font-semibold transition-colors ${
                  isActive ? 'bg-navy-700 text-crease' : 'text-crease/80 hover:bg-navy-800 hover:text-crease'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-chalk lg:grid lg:grid-cols-[250px_1fr]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-navy-950 p-4 text-crease transition-transform lg:static lg:w-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-display text-xl font-black uppercase">Admin</span>
          </Link>
          <button type="button" className="rounded p-1 lg:hidden" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>
        {nav}
        <div className="mt-8 border-t border-navy-800 pt-4 text-sm">
          <p className="truncate text-crease/60" title={session?.user.email}>
            {session?.user.email}
          </p>
          <a href="/" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-crease/80 hover:text-crease">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
          </a>
          <button type="button" onClick={() => void signOut()} className="mt-2 flex items-center gap-2 text-crease/80 hover:text-crease">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-charcoal-950/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-charcoal-400/20 bg-white px-4 py-3 lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded p-1" aria-expanded={open}>
            <Menu aria-hidden="true" />
            <span className="sr-only">Open admin menu</span>
          </button>
          <span className="font-display text-xl font-black uppercase text-navy-900">Swat Kings Admin</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
