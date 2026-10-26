import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Registration } from '../lib/types';

const rpc = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  const client = {
    rpc,
    from: () => ({
      update: (patch: unknown) => {
        update(patch);
        return { eq: () => ({ select: async () => ({ data: [{ id: 'r1' }], error: null }) }) };
      },
    }),
    storage: {
      from: () => ({
        createSignedUrls: async () => ({ data: [], error: null }),
        download: async () => ({ data: new Blob(['x'], { type: 'image/jpeg' }), error: null }),
        upload: async () => ({ data: {}, error: null }),
      }),
    },
  };
  return { ...actual, requireSupabase: () => client };
});

import { RegistrationReview } from '../admin/RegistrationReview';

const base: Registration = {
  id: 'r1',
  reference: 'SK-2610-ABC123',
  player_name: 'Ali Khan',
  guardian_name: null,
  age_group: 'adult',
  phone: '0300 1234567',
  email: 'ali@example.com',
  programme_id: null,
  experience_level: 'club',
  experience_details: null,
  preferred_schedule: 'weekends',
  additional_info: null,
  guardian_consent: false,
  privacy_acknowledged: true,
  status: 'pending',
  admin_notes: null,
  playing_role: 'all_rounder',
  batting_style: 'Right-hand bat',
  bowling_style: null,
  achievements: 'Club top scorer',
  about_player: null,
  photo_paths: ['pending/11111111-1111-4111-8111-111111111111.jpg'],
  public_profile_consent: true,
  player_profile_id: null,
  created_at: '2026-10-26T08:00:00Z',
};

describe('Admin registration review', () => {
  it('accepting adds the player and then offers WhatsApp, SMS and email messages', async () => {
    rpc.mockResolvedValue({ data: 'p1', error: null });
    const onChanged = vi.fn();
    const user = userEvent.setup();
    render(<RegistrationReview reg={base} onClose={() => {}} onChanged={onChanged} />);

    await user.click(screen.getByRole('button', { name: /accept and add to players page/i }));

    expect(rpc).toHaveBeenCalledWith(
      'accept_registration',
      expect.objectContaining({ p_id: 'r1', p_photo_path: expect.stringMatching(/^players\/[0-9a-f-]{36}\.jpg$/), p_extra_photos: [] }),
    );
    const wa = await screen.findByRole('link', { name: /send on whatsapp/i });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/923001234567\?text=/);
    expect(decodeURIComponent(wa.getAttribute('href')!)).toContain('SK-2610-ABC123');
    expect(screen.getByRole('link', { name: /send email/i }).getAttribute('href')).toMatch(/^mailto:ali@example\.com\?subject=/);
    expect(screen.getByRole('link', { name: /send sms/i })).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith(expect.stringContaining('is now on the players page'), false);
  });

  it('does not publish photos when the player did not agree to a public profile', async () => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: null, error: null });
    const user = userEvent.setup();
    render(<RegistrationReview reg={{ ...base, public_profile_consent: false }} onClose={() => {}} onChanged={() => {}} />);
    await user.click(screen.getByRole('button', { name: /^accept registration$/i }));
    expect(rpc).toHaveBeenCalledWith('accept_registration', expect.objectContaining({ p_photo_path: null, p_extra_photos: [] }));
    expect(await screen.findByRole('link', { name: /send on whatsapp/i })).toBeInTheDocument();
  });
});
