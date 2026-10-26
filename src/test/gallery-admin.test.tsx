import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const inserted = vi.hoisted(() => [] as Record<string, unknown>[]);
const uploads = vi.hoisted(() => [] as string[]);

vi.mock('../lib/media', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/media')>();
  return {
    ...actual,
    uploadMedia: vi.fn(async (file: File) => {
      uploads.push(file.name);
      return `gallery/${uploads.length}.jpg`;
    }),
    mediaUrl: () => null,
  };
});

vi.mock('../lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/supabase')>();
  const client = {
    from: () => ({
      select: () => ({ order: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }),
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return { select: async () => ({ data: [{ id: String(inserted.length) }], error: null }) };
      },
    }),
  };
  return { ...actual, requireSupabase: () => client };
});

import GalleryAdmin from '../admin/GalleryAdmin';

describe('Gallery admin', () => {
  it('uploads several photos in one go with the same details', async () => {
    const user = userEvent.setup();
    render(<GalleryAdmin />);
    await user.click(await screen.findByRole('button', { name: /add media/i }));

    const files = ['a.jpg', 'b.jpg', 'c.jpg'].map((n) => new File(['x'], n, { type: 'image/jpeg' }));
    await user.upload(screen.getByLabelText(/photos or videos/i), files);
    expect(screen.getByText(/3 files selected/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/description \(alt text\)/i), 'Net practice in Mingora');
    await user.click(screen.getByRole('button', { name: /add 3 to gallery/i }));

    await waitFor(() => expect(inserted).toHaveLength(3));
    expect(inserted.map((r) => r.alt_text)).toEqual([
      'Net practice in Mingora (1 of 3)',
      'Net practice in Mingora (2 of 3)',
      'Net practice in Mingora (3 of 3)',
    ]);
    expect(inserted.every((r) => r.media_type === 'image' && r.is_published === true)).toBe(true);
    expect(await screen.findByText(/added 3 items to the gallery/i)).toBeInTheDocument();
  });
});
