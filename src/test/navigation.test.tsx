import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { AuthProvider } from '../lib/auth';
import { NAV_ITEMS } from '../lib/nav';
import { SettingsProvider } from '../lib/settings';

// In tests no Supabase keys are set, so every page must still render
// gracefully with "coming soon" states instead of crashing.

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </MemoryRouter>,
  );
}

describe('Public website', () => {
  it('renders the hero with the required copy and buttons', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'BUILD YOUR GAME. OWN YOUR FUTURE.' })).toBeInTheDocument();
    expect(
      screen.getByText('Develop your cricket skills, discipline, confidence, and teamwork with Swat Kings Cricket Academy.'),
    ).toBeInTheDocument();
    const hero = screen.getByRole('heading', { level: 1 }).closest('section')!;
    expect(within(hero).getByRole('link', { name: 'Player Registration' })).toHaveAttribute('href', '/register');
    expect(within(hero).getByRole('link', { name: 'Explore Training' })).toHaveAttribute('href', '/programmes');
  });

  it('does not show fabricated statistics when there is no data', () => {
    renderAt('/');
    expect(screen.queryByText(/training programmes$/i, { selector: 'span' })).not.toBeInTheDocument();
  });

  const expectedHeadings: Record<string, RegExp> = {
    '/about': /about the academy/i,
    '/programmes': /coaching programmes/i,
    '/coaches': /our coaches/i,
    '/teams': /players and teams/i,
    '/fixtures': /fixtures and results/i,
    '/news': /news and announcements/i,
    '/gallery': /gallery/i,
    '/contact': /contact us/i,
    '/register': /player registration/i,
    '/privacy': /privacy policy/i,
  };

  it.each(Object.entries(expectedHeadings))('renders %s with its own heading', async (path, heading) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('every main navigation link has a matching page', () => {
    for (const item of NAV_ITEMS) expect(expectedHeadings[item.to]).toBeDefined();
  });

  it('navigates between pages using the menu', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getAllByRole('navigation', { name: 'Footer' })[0];
    await user.click(within(nav).getByRole('link', { name: 'Programmes' }));
    expect(await screen.findByRole('heading', { level: 1, name: /coaching programmes/i })).toBeInTheDocument();
  });

  it('opens and closes the mobile menu with the keyboard', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a custom 404 page for unknown addresses', () => {
    renderAt('/this-page-does-not-exist');
    expect(screen.getByRole('heading', { level: 1, name: /clean bowled/i })).toBeInTheDocument();
  });

  it('shows friendly "coming soon" states instead of errors when the database is not connected', async () => {
    renderAt('/coaches');
    expect(await screen.findByText(/content coming soon/i)).toBeInTheDocument();
  });
});

describe('Admin area protection', () => {
  it('sends visitors who are not signed in to the login page', async () => {
    renderAt('/admin/registrations');
    expect(await screen.findByRole('heading', { name: /staff sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^registrations$/i })).not.toBeInTheDocument();
  });

  it('has no public sign-up option', async () => {
    renderAt('/admin/login');
    await screen.findByRole('heading', { name: /staff sign in/i });
    expect(screen.queryByRole('button', { name: /sign up|create account|register/i })).not.toBeInTheDocument();
  });
});
