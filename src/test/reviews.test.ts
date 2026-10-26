import { describe, expect, it } from 'vitest';
import { reviewSchema } from '../lib/validation';

describe('review form rules', () => {
  const base = { name: 'Ali Khan', relationship: 'parent', rating: '5', comment: 'Great coaching for my son.', website: '' };

  it('accepts a genuine review and turns the star choice into a number', () => {
    const res = reviewSchema.safeParse(base);
    expect(res.success).toBe(true);
    expect(res.success && res.data.rating).toBe(5);
  });

  it('requires a star rating from 1 to 5', () => {
    expect(reviewSchema.safeParse({ ...base, rating: undefined }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...base, rating: '6' }).success).toBe(false);
  });

  it('rejects web links, a common sign of spam', () => {
    expect(reviewSchema.safeParse({ ...base, comment: 'Cheap deals at www.spam-site.example' }).success).toBe(false);
  });
});
