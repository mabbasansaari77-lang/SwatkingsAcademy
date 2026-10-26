import { Check, EyeOff, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ErrorState, Loading } from '../components/ui/States';
import { formatDateTime } from '../lib/format';
import { requireSupabase } from '../lib/supabase';
import type { Review, ReviewStatus } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { REVIEW_RELATIONSHIPS } from '../lib/validation';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

const FILTERS: { value: ReviewStatus; label: string }[] = [
  { value: 'pending', label: 'Waiting for approval' },
  { value: 'approved', label: 'Approved (public)' },
  { value: 'hidden', label: 'Hidden' },
];

export default function ReviewsAdmin() {
  const [filter, setFilter] = useState<ReviewStatus>('pending');
  const [notice, setNotice] = useState<Notice>(null);

  const list = useAsync(async () => {
    const q = requireSupabase()
      .from('reviews')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(300);
    return unwrap(await q) as Review[];
  }, [filter]);

  const setStatus = async (r: Review, status: ReviewStatus) => {
    const approved_at = status === 'approved' ? new Date().toISOString() : r.approved_at;
    const res = await requireSupabase().from('reviews').update({ status, approved_at }).eq('id', r.id).select('id');
    if (res.error || !res.data?.length) setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else {
      setNotice({
        kind: 'success',
        text: status === 'approved' ? `Review from ${r.name} is now on the Reviews page.` : `Review from ${r.name} is hidden from the website.`,
      });
      list.reload();
    }
  };

  const remove = async (r: Review) => {
    if (!window.confirm(`Delete the review from ${r.name}? This cannot be undone.`)) return;
    const res = await requireSupabase().from('reviews').delete().eq('id', r.id).select('id');
    if (res.error || !res.data?.length) setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else {
      setNotice({ kind: 'success', text: 'Review deleted.' });
      list.reload();
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Reviews"
        intro="New reviews wait here until you approve them. Approve genuine reviews, including critical ones; hide or delete spam and abuse."
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <div role="group" aria-label="Filter reviews" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border-2 px-4 py-1 text-sm font-semibold ${
              filter === f.value ? 'border-navy-800 bg-navy-800 text-crease' : 'border-navy-800/30 text-navy-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <Panel className="p-0">
        {list.loading && !list.data ? (
          <div className="p-5"><Loading /></div>
        ) : list.error ? (
          <div className="p-5"><ErrorState error={list.error} onRetry={list.reload} /></div>
        ) : !list.data?.length ? (
          <p className="p-8 text-center text-charcoal-600">No reviews here.</p>
        ) : (
          <ul>
            {list.data.map((r) => (
              <li key={r.id} className="border-b border-charcoal-400/15 px-5 py-4 last:border-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex text-accent-500" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-current' : 'text-charcoal-400/50'}`} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="font-bold">{r.name}</span>
                  <span className="text-sm text-charcoal-600">
                    {REVIEW_RELATIONSHIPS.find((x) => x.value === r.relationship)?.label} — {formatDateTime(r.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-charcoal-800">{r.comment}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {r.status !== 'approved' && (
                    <button type="button" onClick={() => void setStatus(r, 'approved')} className="inline-flex items-center gap-1 font-semibold text-navy-800 underline">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" /> Approve and show on website
                    </button>
                  )}
                  {r.status !== 'hidden' && (
                    <button type="button" onClick={() => void setStatus(r, 'hidden')} className="inline-flex items-center gap-1 font-semibold text-navy-800 underline">
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> Hide
                    </button>
                  )}
                  <button type="button" onClick={() => void remove(r)} className="inline-flex items-center gap-1 font-semibold text-cherry">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
