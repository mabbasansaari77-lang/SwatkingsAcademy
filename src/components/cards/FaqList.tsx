import { ChevronDown } from 'lucide-react';
import type { Faq } from '../../lib/types';

/** Questions and answers as native disclosure widgets: readable by crawlers, keyboard friendly. */
export function FaqList({ faqs, openFirst = false }: { faqs: Faq[]; openFirst?: boolean }) {
  return (
    <div className="divide-y divide-navy-800/15 rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
      {faqs.map((f, i) => (
        <details key={f.id} className="group px-5 py-1" open={openFirst && i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl font-bold text-navy-900 [&::-webkit-details-marker]:hidden">
            <h3>{f.question}</h3>
            <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="whitespace-pre-line pb-5 text-charcoal-800">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
