import { describe, expect, it } from 'vitest';
import { contactSchema, parseYouTubeId, registrationSchema, slugify } from '../lib/validation';

const validAdult = {
  player_name: 'Ali Khan',
  age_group: 'adult',
  phone: '+92 300 1234567',
  experience_level: 'club',
  preferred_schedule: 'weekends',
  privacy_acknowledged: true,
};

describe('registrationSchema', () => {
  it('accepts a valid adult registration without guardian details', () => {
    const result = registrationSchema.safeParse(validAdult);
    expect(result.success).toBe(true);
  });

  it('requires guardian name and consent for players under 19', () => {
    const result = registrationSchema.safeParse({ ...validAdult, age_group: 'under_14' });
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('guardian_name');
    expect(paths).toContain('guardian_consent');
  });

  it('accepts a minor when guardian name and consent are given', () => {
    const result = registrationSchema.safeParse({
      ...validAdult,
      age_group: 'under_12',
      guardian_name: 'Sana Khan',
      guardian_consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('requires the privacy notice to be acknowledged', () => {
    const result = registrationSchema.safeParse({ ...validAdult, privacy_acknowledged: false });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phone numbers and emails', () => {
    expect(registrationSchema.safeParse({ ...validAdult, phone: 'call me' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validAdult, email: 'not-an-email' }).success).toBe(false);
  });

  it('treats an empty email as not provided and lower-cases emails', () => {
    const empty = registrationSchema.parse({ ...validAdult, email: '' });
    expect(empty.email).toBeUndefined();
    const filled = registrationSchema.parse({ ...validAdult, email: 'Ali@Example.COM' });
    expect(filled.email).toBe('ali@example.com');
  });

  it('rejects unknown age groups and over-long text', () => {
    expect(registrationSchema.safeParse({ ...validAdult, age_group: 'under_5' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validAdult, additional_info: 'x'.repeat(1501) }).success).toBe(false);
  });

  it('does not collect a date of birth field', () => {
    const parsed = registrationSchema.parse({ ...validAdult, date_of_birth: '2010-01-01' } as Record<string, unknown>);
    expect(parsed).not.toHaveProperty('date_of_birth');
  });
});

describe('contactSchema', () => {
  const valid = { name: 'Visitor', contact: 'visitor@example.com', subject: 'Trials', message: 'When are the next trials?' };
  it('accepts an email or a phone number as contact', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, contact: '0300 1234567' }).success).toBe(true);
  });
  it('rejects short messages and invalid contact details', () => {
    expect(contactSchema.safeParse({ ...valid, message: 'hi' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, contact: 'nowhere' }).success).toBe(false);
  });
});

describe('helpers', () => {
  it('slugify creates URL-safe slugs', () => {
    expect(slugify('Under-14 Trials: Saturday!')).toBe('under-14-trials-saturday');
    expect(slugify('  Fitness & Agility  ')).toBe('fitness-agility');
  });

  it('parseYouTubeId understands common YouTube links', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseYouTubeId('not a link')).toBeNull();
  });
});
