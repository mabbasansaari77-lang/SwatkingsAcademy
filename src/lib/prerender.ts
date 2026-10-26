/**
 * Data embedded in pre-rendered pages.
 *
 * At build time scripts/prerender.mjs fetches public content from Supabase,
 * renders each page to HTML and stores the data it used in
 * <script type="application/json" id="skca-data">. The browser reads it here so
 * the page shows the same content immediately, then refreshes it live.
 */
type Seed = Record<string, unknown>;

declare global {
  var __SKCA_DATA__: Seed | undefined;
}

export function readEmbeddedSeed(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('skca-data');
  if (!el?.textContent) return;
  try {
    globalThis.__SKCA_DATA__ = JSON.parse(el.textContent) as Seed;
  } catch {
    globalThis.__SKCA_DATA__ = undefined;
  }
}

/** Removes the pre-rendered <title>/<meta>/<link> tags; React adds the live ones. */
export function removePrerenderedHead(): void {
  if (typeof document === 'undefined') return;
  document.head.querySelectorAll('[data-pr]').forEach((el) => el.remove());
}

export function getSeed<T>(key: string | undefined): T | undefined {
  if (!key) return undefined;
  const seed = globalThis.__SKCA_DATA__;
  return seed && key in seed ? (seed[key] as T) : undefined;
}

export const isServer = typeof window === 'undefined';
