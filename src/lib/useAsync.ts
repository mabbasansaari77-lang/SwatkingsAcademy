import { useCallback, useEffect, useState } from 'react';
import { getSeed } from './prerender';

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => void;
}

interface InternalState<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
}

/**
 * Runs an async loader and tracks loading/error state.
 * The loader re-runs whenever a value in `deps` changes, or when reload() is called.
 *
 * `seedKey` lets a pre-rendered page start with data that was fetched at build
 * time (see lib/prerender.ts). The live data is still loaded straight after.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = [], seedKey?: string): AsyncState<T> {
  const [state, setState] = useState<InternalState<T>>(() => {
    const seeded = getSeed<T>(seedKey);
    return seeded !== undefined
      ? { data: seeded, error: null, loading: false }
      : { data: undefined, error: null, loading: true };
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: true, error: null }));
        return loader();
      })
      .then((result) => {
        if (!cancelled) setState({ data: result, error: null, loading: false });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Keep showing pre-rendered data if the live refresh fails.
        setState((s) =>
          s.data !== undefined && tick === 0
            ? { ...s, loading: false }
            : { ...s, loading: false, error: err instanceof Error ? err : new Error(String(err)) },
        );
      });
    return () => {
      cancelled = true;
    };
    // The caller controls re-runs through `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

/** Turns a Supabase { data, error } response into a value or a thrown Error. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
