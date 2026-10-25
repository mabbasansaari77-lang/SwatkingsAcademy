import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitRegistration = vi.fn();

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  return { ...actual, isSupabaseConfigured: true };
});

vi.mock('../lib/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/queries')>();
  return {
    ...actual,
    fetchProgrammes: vi.fn().mockResolvedValue([
      { id: '11111111-1111-4111-8111-111111111111', name: 'Beginner Cricket', status: 'open', category: 'beginner' },
      { id: '22222222-2222-4222-8222-222222222222', name: 'Closed Squad', status: 'closed', category: 'advanced' },
    ]),
  };
});

const failNext = vi.hoisted(() => ({ current: null as string | null }));

vi.mock('../lib/submissions', () => ({
  submitRegistration: async (...args: unknown[]) => {
    if (failNext.current) {
      const message = failNext.current;
      failNext.current = null;
      throw new Error(message);
    }
    return submitRegistration(...args);
  },
}));

import Register from '../pages/Register';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Register />
    </MemoryRouter>,
  );
}

async function fillAdult(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/player’s full name/i), 'Ali Khan');
  await user.selectOptions(screen.getByLabelText(/^age group/i), 'adult');
  await user.type(screen.getByLabelText(/contact phone/i), '+92 300 1234567');
  await user.selectOptions(screen.getByLabelText(/previous cricket experience/i), 'club');
  await user.selectOptions(screen.getByLabelText(/preferred training schedule/i), 'weekends');
  await user.click(screen.getByRole('checkbox', { name: /privacy notice/i }));
}

describe('Registration form', () => {
  beforeEach(() => submitRegistration.mockReset());

  it('shows validation errors and does not submit an empty form', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /submit registration/i }));
    expect(await screen.findByText(/enter the player’s full name/i)).toBeInTheDocument();
    expect(screen.getByText(/choose an age group/i, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/confirm you have read the privacy notice/i)).toBeInTheDocument();
    expect(submitRegistration).not.toHaveBeenCalled();
  });

  it('requires guardian details for under-19 players', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillAdult(user);
    await user.selectOptions(screen.getByLabelText(/^age group/i), 'under_14');
    await user.click(screen.getByRole('button', { name: /submit registration/i }));
    expect(await screen.findByText(/parent or guardian name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/parent or guardian consent is required/i)).toBeInTheDocument();
    expect(submitRegistration).not.toHaveBeenCalled();
  });

  it('hides closed programmes from the programme list', async () => {
    renderPage();
    expect(await screen.findByRole('option', { name: 'Beginner Cricket' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /closed squad/i })).not.toBeInTheDocument();
  });

  it('submits valid data and shows the registration reference', async () => {
    submitRegistration.mockResolvedValue('SK-2610-ABC123');
    const user = userEvent.setup();
    renderPage();
    await fillAdult(user);
    await user.click(screen.getByRole('button', { name: /submit registration/i }));

    await waitFor(() => expect(submitRegistration).toHaveBeenCalledTimes(1));
    const payload = submitRegistration.mock.calls[0][0];
    expect(payload).toMatchObject({
      player_name: 'Ali Khan',
      age_group: 'adult',
      phone: '+92 300 1234567',
      experience_level: 'club',
      preferred_schedule: 'weekends',
      privacy_acknowledged: true,
    });
    expect(payload).not.toHaveProperty('date_of_birth');
    expect(await screen.findByText('SK-2610-ABC123')).toBeInTheDocument();
    expect(screen.getByText(/registration received/i)).toBeInTheDocument();
  });

  it('shows the server’s error message when submission fails', async () => {
    failNext.current = 'Too many submissions. Please wait an hour and try again.';
    const user = userEvent.setup();
    renderPage();
    await fillAdult(user);
    await user.click(screen.getByRole('button', { name: /submit registration/i }));
        const alert = await screen.findByText(/too many submissions/i);
    expect(alert).toBeInTheDocument();
  });
});
