import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

const player = vi.hoisted(() => ({
  value: null as unknown,
}));

vi.mock('../lib/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/queries')>();
  return { ...actual, fetchPlayer: vi.fn(async () => player.value) };
});

import PlayerDetail from '../pages/PlayerDetail';

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/players/${id}`]}>
      <Routes>
        <Route path="/players/:id" element={<PlayerDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Player profile page', () => {
  it('shows details, achievements, about text and the photo/video gallery', async () => {
    player.value = {
      id: '11111111-1111-4111-8111-111111111111',
      team_id: null,
      display_name: 'Waqas Khan',
      playing_role: 'batter',
      batting_style: 'Right-hand top-order batter',
      bowling_style: null,
      approved_achievements: 'U-17 Peshawar Region 2025',
      bio: 'Opening batter who loves the cut shot.',
      photo_url: null,
      sort_order: 0,
      consent_confirmed: true,
      is_public: true,
      team: { name: 'U-17 Squad', age_group: 'Under 17' },
      media: [
        { id: 'm1', player_id: 'p', media_type: 'image', storage_path: 'players/a.jpg', youtube_id: null, caption: 'Nets', alt_text: 'Waqas batting in the nets', sort_order: 0, created_at: '' },
        { id: 'm2', player_id: 'p', media_type: 'video', storage_path: null, youtube_id: 'dQw4w9WgXcQ', caption: 'Highlights', alt_text: 'Match highlights', sort_order: 1, created_at: '' },
      ],
    };
    renderAt('11111111-1111-4111-8111-111111111111');
    expect(await screen.findByRole('heading', { level: 1, name: 'Waqas Khan' })).toBeInTheDocument();
    expect(screen.getAllByText('Batter').length).toBeGreaterThan(0);
    expect(screen.getByText('U-17 Peshawar Region 2025')).toBeInTheDocument();
    expect(screen.getByText('Opening batter who loves the cut shot.')).toBeInTheDocument();
    expect(screen.getByText('1 photo, 1 video')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play video/i })).toBeInTheDocument();
  });

  it('shows the 404 page when the profile is not public', async () => {
    player.value = null;
    renderAt('22222222-2222-4222-8222-222222222222');
    expect(await screen.findByRole('heading', { level: 1, name: /clean bowled/i })).toBeInTheDocument();
  });
});
