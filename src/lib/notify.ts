/**
 * Ready-to-send approval messages. The admin panel opens WhatsApp or the
 * admin's email app with this text filled in; the admin presses Send.
 * Nothing is sent automatically and no paid service is used.
 */

/**
 * Converts a phone number typed on the form into the international digits
 * WhatsApp needs (no +, no spaces). Numbers without a country code are
 * treated as Pakistani: 0300 1234567 → 923001234567.
 * Returns null when the number is clearly unusable.
 */
export function whatsappNumber(phone: string): string | null {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = `92${digits.slice(1)}`;
  } else if (digits.length === 10 && digits.startsWith('3')) {
    digits = `92${digits}`;
  }
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export interface ApprovalInfo {
  academyName: string;
  playerName: string;
  guardianName?: string | null;
  reference: string;
  profileUrl?: string | null;
  academyPhone?: string | null;
}

export function approvalMessage(info: ApprovalInfo): string {
  const greetName = info.guardianName?.trim() || info.playerName;
  const lines = [
    `Assalam o Alaikum ${greetName},`,
    '',
    `Congratulations! ${info.guardianName ? `${info.playerName}'s` : 'Your'} player registration with ${info.academyName} has been approved. (Reference: ${info.reference})`,
  ];
  if (info.profileUrl) lines.push('', `Player profile: ${info.profileUrl}`);
  lines.push('', 'We will contact you soon with training details.');
  if (info.academyPhone) lines.push(`Questions? Call or WhatsApp us on ${info.academyPhone}.`);
  lines.push('', `— ${info.academyName}`);
  return lines.join('\n');
}

export function whatsappLink(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function emailLink(email: string, subject: string, message: string): string {
  return `mailto:${encodeURIComponent(email).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

export function smsLink(phone: string, message: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `sms:+${number}?body=${encodeURIComponent(message)}` : null;
}
