const TZ = 'Asia/Karachi';

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ }).format(
    new Date(iso),
  );
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  }).format(new Date(iso));
}

export function dateParts(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat('en-GB', { day: '2-digit', timeZone: TZ }).format(d),
    month: new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: TZ }).format(d),
    time: new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(d),
  };
}

/** Converts an ISO string to the value format of <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Builds a wa.me link from a phone number, or null if it has too few digits. */
export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}

export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

/** Splits plain text into paragraphs on blank lines. */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
