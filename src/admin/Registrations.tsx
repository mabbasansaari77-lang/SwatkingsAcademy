import { Download, Loader2, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ErrorState, Loading } from '../components/ui/States';
import { formatDateTime } from '../lib/format';
import { AGE_GROUPS, EXPERIENCE_LEVELS, labelFor, REGISTRATION_STATUSES, SCHEDULES } from '../lib/labels';
import { requireSupabase } from '../lib/supabase';
import type { Registration, RegistrationStatus } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, Pill, type Notice } from './ui';

interface Filters {
  q: string;
  status: string;
  programme: string;
  from: string;
  to: string;
}

const EMPTY: Filters = { q: '', status: '', programme: '', from: '', to: '' };

function csvEscape(v: unknown): string {
  let s = v == null ? '' : String(v);
  // Prevent spreadsheet formula injection when opened in Excel
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCsv(rows: Registration[]) {
  const header = [
    'Reference', 'Submitted', 'Status', 'Player', 'Guardian', 'Age group', 'Phone', 'Email', 'Programme',
    'Experience', 'Experience details', 'Schedule', 'Additional info', 'Guardian consent', 'Admin notes',
  ];
  const lines = rows.map((r) =>
    [
      r.reference, formatDateTime(r.created_at), labelFor(REGISTRATION_STATUSES, r.status), r.player_name, r.guardian_name,
      labelFor(AGE_GROUPS, r.age_group), r.phone, r.email, r.programme?.name, labelFor(EXPERIENCE_LEVELS, r.experience_level),
      r.experience_details, labelFor(SCHEDULES, r.preferred_schedule), r.additional_info, r.guardian_consent ? 'Yes' : 'No',
      r.admin_notes,
    ]
      .map(csvEscape)
      .join(','),
  );
  const blob = new Blob(['﻿' + [header.map(csvEscape).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function Detail({ reg, onClose, onSaved }: { reg: Registration; onClose: () => void; onSaved: (text: string) => void }) {
  const [status, setStatus] = useState<RegistrationStatus>(reg.status);
  const [notes, setNotes] = useState(reg.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const res = await requireSupabase()
      .from('registrations')
      .update({ status, admin_notes: notes.trim() || null })
      .eq('id', reg.id)
      .select('id');
    setSaving(false);
    if (res.error || !res.data?.length) {
      setError(friendlyDbError(res.error?.message ?? 'permission denied'));
      return;
    }
    onSaved(`Updated ${reg.reference} to ${labelFor(REGISTRATION_STATUSES, status)}.`);
  };

  const rows: [string, string | null][] = [
    ['Reference', reg.reference],
    ['Submitted', formatDateTime(reg.created_at)],
    ['Player', reg.player_name],
    ['Parent / guardian', reg.guardian_name],
    ['Age group', labelFor(AGE_GROUPS, reg.age_group)],
    ['Phone', reg.phone],
    ['Email', reg.email],
    ['Programme', reg.programme?.name ?? 'Not sure yet'],
    ['Experience', labelFor(EXPERIENCE_LEVELS, reg.experience_level)],
    ['Experience details', reg.experience_details],
    ['Preferred schedule', labelFor(SCHEDULES, reg.preferred_schedule)],
    ['Additional information', reg.additional_info],
    ['Guardian consent', reg.guardian_consent ? 'Yes' : reg.age_group === 'adult' ? 'Not needed (adult)' : 'No'],
  ];

  return (
    <Panel className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-navy-900">{reg.player_name}</h2>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-chalk">
          <X aria-hidden="true" />
          <span className="sr-only">Close details</span>
        </button>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm text-charcoal-600">{k}</dt>
              <dd className="whitespace-pre-line font-semibold break-words">
                {k === 'Phone' ? (
                  <a href={`tel:${v!.replace(/[^0-9+]/g, '')}`} className="underline underline-offset-4">
                    {v}
                  </a>
                ) : k === 'Email' ? (
                  <a href={`mailto:${v}`} className="underline underline-offset-4">
                    {v}
                  </a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
      </dl>
      <div className="mt-6 grid gap-4 border-t border-charcoal-400/20 pt-5 sm:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor="reg-status" className="mb-1.5 block font-semibold">
            Application status
          </label>
          <select id="reg-status" className="field-input" value={status} onChange={(e) => setStatus(e.target.value as RegistrationStatus)}>
            {REGISTRATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reg-notes" className="mb-1.5 block font-semibold">
            Private admin notes
          </label>
          <textarea id="reg-notes" rows={3} maxLength={2000} className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && <div className="mt-4"><NoticeBar notice={{ kind: 'error', text: error }} /></div>}
      <div className="mt-4 flex gap-3">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} Save
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Panel>
  );
}

export default function Registrations() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    const t = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const programmes = useAsync(async () => {
    const res = await requireSupabase().from('programmes').select('id, name').order('name');
    return unwrap(res) as { id: string; name: string }[];
  });

  const list = useAsync(async () => {
    let q = requireSupabase()
      .from('registrations')
      .select('*, programme:programmes(name)')
      .order('created_at', { ascending: false })
      .limit(500);
    if (applied.status) q = q.eq('status', applied.status);
    if (applied.programme === 'none') q = q.is('programme_id', null);
    else if (applied.programme) q = q.eq('programme_id', applied.programme);
    if (applied.from) q = q.gte('created_at', new Date(`${applied.from}T00:00:00`).toISOString());
    if (applied.to) q = q.lte('created_at', new Date(`${applied.to}T23:59:59`).toISOString());
    const term = applied.q.trim().replace(/[%_,()*]/g, ' ');
    if (term) q = q.or(`player_name.ilike.*${term}*,reference.ilike.*${term}*,phone.ilike.*${term}*,guardian_name.ilike.*${term}*`);
    return unwrap(await q) as Registration[];
  }, [applied]);

  const set = (k: keyof Filters, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div>
      <AdminPageHeader
        title="Registrations"
        intro="Private applications from the registration form. Only admins can see these."
        action={
          <Button variant="outline-dark" size="sm" disabled={!list.data?.length} onClick={() => list.data && exportCsv(list.data)}>
            <Download className="h-4 w-4" aria-hidden="true" /> Export to Excel (CSV)
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      {selected && (
        <Detail
          key={selected.id}
          reg={selected}
          onClose={() => setSelected(null)}
          onSaved={(text) => {
            setSelected(null);
            setNotice({ kind: 'success', text });
            list.reload();
          }}
        />
      )}
      <Panel>
        <div className="mb-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search registrations</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
            <input
              type="search"
              className="field-input pl-9"
              placeholder="Name, reference or phone"
              value={filters.q}
              onChange={(e) => set('q', e.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select className="field-input" value={filters.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">All statuses</option>
              {REGISTRATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by programme</span>
            <select className="field-input" value={filters.programme} onChange={(e) => set('programme', e.target.value)}>
              <option value="">All programmes</option>
              <option value="none">Not sure yet</option>
              {programmes.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            From
            <input type="date" className="field-input" value={filters.from} onChange={(e) => set('from', e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            To
            <input type="date" className="field-input" value={filters.to} onChange={(e) => set('to', e.target.value)} />
          </label>
        </div>
        {hasFilters && (
          <button type="button" onClick={() => setFilters(EMPTY)} className="mb-3 text-sm font-semibold text-navy-800 underline">
            Clear filters
          </button>
        )}

        {list.loading && !list.data ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.length ? (
          <p className="py-8 text-center text-charcoal-600">
            {hasFilters ? 'No registrations match these filters.' : 'No registrations yet. They will appear here when people use the form.'}
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm text-charcoal-600">
              Showing {list.data.length} {list.data.length === 1 ? 'registration' : 'registrations'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-charcoal-400/30 text-charcoal-600">
                    <th scope="col" className="py-2 pr-4 font-semibold">Submitted</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Reference</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Player</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Age group</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Programme</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Phone</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                    <th scope="col" className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((r) => (
                    <tr key={r.id} className="border-b border-charcoal-400/15 last:border-0 hover:bg-chalk/60">
                      <td className="py-2.5 pr-4 whitespace-nowrap">{formatDateTime(r.created_at)}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{r.reference}</td>
                      <td className="py-2.5 pr-4 font-semibold">{r.player_name}</td>
                      <td className="py-2.5 pr-4">{labelFor(AGE_GROUPS, r.age_group)}</td>
                      <td className="py-2.5 pr-4">{r.programme?.name ?? '—'}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">{r.phone}</td>
                      <td className="py-2.5 pr-4">
                        <Pill value={r.status} label={labelFor(REGISTRATION_STATUSES, r.status)} />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(r);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="rounded px-2 py-1 font-semibold text-navy-800 hover:bg-navy-800/10"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
