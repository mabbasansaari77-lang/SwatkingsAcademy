/**
 * Structured data (schema.org JSON-LD) for search engines and AI assistants.
 * Only pass real, confirmed information — never placeholders.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
