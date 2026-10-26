import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../lib/defaultSettings';
import { faqSchema, organizationSchema } from '../lib/schema';

describe('Structured data', () => {
  it('never invents contact details: empty settings produce no address, phone or email', () => {
    const org = organizationSchema(DEFAULT_SETTINGS);
    expect(org['@type']).toBe('SportsOrganization');
    expect(org.sport).toBe('Cricket');
    expect(org).not.toHaveProperty('address');
    expect(org).not.toHaveProperty('telephone');
    expect(org).not.toHaveProperty('email');
    expect(org).not.toHaveProperty('sameAs');
    expect(org).not.toHaveProperty('aggregateRating');
  });

  it('includes contact details only once the academy has entered them', () => {
    const org = organizationSchema({
      ...DEFAULT_SETTINGS,
      phone: '+92 300 1234567',
      address: 'Ground road, Mingora',
      facebook_url: 'https://facebook.com/example',
    });
    expect(org.telephone).toBe('+92 300 1234567');
    expect(org.address).toMatchObject({ streetAddress: 'Ground road, Mingora', addressCountry: 'PK' });
    expect(org.sameAs).toEqual(['https://facebook.com/example']);
  });

  it('builds FAQPage data only when there are published questions', () => {
    expect(faqSchema([])).toBeNull();
    const faq = faqSchema([{ id: '1', question: 'What age can my child join?', answer: 'From under-10.', is_published: true, sort_order: 0 }]);
    expect(faq).toMatchObject({ '@type': 'FAQPage', mainEntity: [{ name: 'What age can my child join?', acceptedAnswer: { text: 'From under-10.' } }] });
  });
});
