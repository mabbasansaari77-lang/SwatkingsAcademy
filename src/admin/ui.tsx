import { CheckCircle2, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function AdminPageHeader({ title, intro, action }: { title: string; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold text-navy-900">{title}</h1>
        {intro && <p className="mt-1 max-w-2xl text-charcoal-600">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

export type Notice = { kind: 'success' | 'error'; text: string } | null;

export function NoticeBar({ notice, onDismiss }: { notice: Notice; onDismiss?: () => void }) {
  if (!notice) return null;
  const ok = notice.kind === 'success';
  return (
    <div
      role={ok ? 'status' : 'alert'}
      className={`mb-4 flex items-start gap-3 rounded-md border p-3 ${
        ok ? 'border-sky-500/40 bg-sky-100 text-navy-900' : 'border-cherry/40 bg-cherry/5 text-charcoal-900'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-cherry" aria-hidden="true" />
      )}
      <p className="flex-1">{notice.text}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-sm font-semibold underline">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.06)] ${className}`}>{children}</div>;
}

const pill: Record<string, string> = {
  pending: 'bg-accent-300/50 text-accent-700',
  contacted: 'bg-[#dbe7f5] text-[#24507f]',
  accepted: 'bg-sky-100 text-navy-800',
  rejected: 'bg-charcoal-800/10 text-charcoal-600',
  published: 'bg-sky-100 text-navy-800',
  draft: 'bg-charcoal-800/10 text-charcoal-600',
  yes: 'bg-sky-100 text-navy-800',
  no: 'bg-charcoal-800/10 text-charcoal-600',
};

export function Pill({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${pill[value] ?? 'bg-chalk text-charcoal-800'}`}>
      {label ?? value}
    </span>
  );
}
