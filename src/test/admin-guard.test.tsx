import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

const authState = vi.hoisted(() => ({
  value: { session: null as unknown, isAdmin: false, loading: false, signIn: async () => {}, signOut: async () => {} },
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => authState.value,
}));

import { RequireAdmin } from '../admin/RequireAdmin';

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin/login" element={<p>login page</p>} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <p>secret admin content</p>
            </RequireAdmin>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAdmin', () => {
  it('redirects signed-out visitors to the login page', () => {
    authState.value = { ...authState.value, session: null, isAdmin: false };
    renderGuard();
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument();
  });

  it('blocks signed-in users who do not have the admin role', () => {
    authState.value = { ...authState.value, session: { user: { email: 'coach@example.com' } }, isAdmin: false };
    renderGuard();
    expect(screen.getByRole('heading', { name: /no admin access/i })).toBeInTheDocument();
    expect(screen.queryByText('secret admin content')).not.toBeInTheDocument();
  });

  it('shows a loading state while access is being checked', () => {
    authState.value = { ...authState.value, session: null, loading: true };
    renderGuard();
    expect(screen.getByRole('status')).toHaveTextContent(/checking your access/i);
    authState.value = { ...authState.value, loading: false };
  });

  it('shows admin content only to confirmed admins', () => {
    authState.value = { ...authState.value, session: { user: { email: 'admin@example.com' } }, isAdmin: true };
    renderGuard();
    expect(screen.getByText('secret admin content')).toBeInTheDocument();
  });
});
