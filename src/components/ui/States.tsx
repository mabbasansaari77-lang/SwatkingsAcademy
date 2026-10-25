import { AlertTriangle, Loader2, PlugZap } from 'lucide-react';
import type { ReactNode } from 'react';
import { NotConfiguredError } from '../../lib/supabase';

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-charcoal-600">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-charcoal-400/40 px-6 py-10 text-center">
      {icon && <div className="mb-3 flex justify-center text-navy-600">{icon}</div>}
      <p className="font-display text-2xl font-bold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-charcoal-600">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  if (error instanceof NotConfiguredError) {
    return (
      <EmptyState title="Content coming soon" icon={<PlugZap className="h-8 w-8" aria-hidden="true" />}>
        This section will show academy information once the website database is connected.
      </EmptyState>
    );
  }
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-cherry/30 bg-cherry/5 px-5 py-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-cherry" aria-hidden="true" />
      <p className="flex-1">This section could not be loaded. Check your connection and try again.</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold text-navy-800 underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

interface AsyncBlockProps<T> {
  state: { data: T | undefined; error: Error | null; loading: boolean; reload: () => void };
  empty?: (data: T) => boolean;
  emptyView?: ReactNode;
  loadingLabel?: string;
  children: (data: T) => ReactNode;
}

/** Renders loading, error, empty or content views for an async query. */
export function AsyncBlock<T>({ state, empty, emptyView, loadingLabel, children }: AsyncBlockProps<T>) {
  if (state.loading && state.data === undefined) return <Loading label={loadingLabel} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data === undefined) return null;
  if (empty?.(state.data)) return <>{emptyView}</>;
  return <>{children(state.data)}</>;
}
