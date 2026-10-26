import { describe, expect, it } from 'vitest';
import { approvalMessage, emailLink, whatsappLink, whatsappNumber } from '../lib/notify';

describe('Approval notifications', () => {
  it('turns local Pakistani numbers into WhatsApp format', () => {
    expect(whatsappNumber('0300 1234567')).toBe('923001234567');
    expect(whatsappNumber('0300-1234567')).toBe('923001234567');
    expect(whatsappNumber('3001234567')).toBe('923001234567');
    expect(whatsappNumber('+92 300 1234567')).toBe('923001234567');
    expect(whatsappNumber('0092 300 1234567')).toBe('923001234567');
  });

  it('keeps other international numbers and rejects junk', () => {
    expect(whatsappNumber('+966 50 123 4567')).toBe('966501234567');
    expect(whatsappNumber('123')).toBeNull();
    expect(whatsappNumber('')).toBeNull();
  });

  it('writes a message to the guardian for under-19 players', () => {
    const msg = approvalMessage({
      academyName: 'Swat Kings Cricket Academy',
      playerName: 'Ali',
      guardianName: 'Khan Sahib',
      reference: 'SK-2610-ABC123',
      profileUrl: 'https://example.com/players/1',
    });
    expect(msg).toContain('Assalam o Alaikum Khan Sahib');
    expect(msg).toContain("Ali's player registration with Swat Kings Cricket Academy has been approved");
    expect(msg).toContain('SK-2610-ABC123');
    expect(msg).toContain('https://example.com/players/1');
  });

  it('builds WhatsApp and email links with the message encoded', () => {
    const link = whatsappLink('0300 1234567', 'Hello & welcome');
    expect(link).toBe('https://wa.me/923001234567?text=Hello%20%26%20welcome');
    expect(emailLink('a@b.com', 'Approved', 'Hi')).toBe('mailto:a@b.com?subject=Approved&body=Hi');
  });
});
