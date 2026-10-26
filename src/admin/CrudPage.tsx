import { Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { ErrorState, Loading } from '../components/ui/States';
import { fromLocalInput, toLocalInput } from '../lib/format';
import { deleteMedia, mediaUrl, uploadMedia, validateMediaFile } from '../lib/media';
import { requireSupabase } from '../lib/supabase';
import { unwrap, useAsync } from '../lib/useAsync';
import { slugify } from '../lib/validation';
import { friendlyDbError } from './errors';
import type { FieldDef, ResourceDef } from './resources';
import { AdminPageHeader, NoticeBar, Panel, Pill, type Notice } from './ui';

type Row = Record<string, unknown>;

function toFormValue(field: FieldDef, value: unknown): unknown {
  if (field.type === 'checkbox') return Boolean(value);
  if (field.type === 'datetime') return toLocalInput(value as string | null);
  if (value == null) return '';
  return value;
}

function toDbValue(field: FieldDef, value: unknown): unknown {
  switch (field.type) {
    case 'checkbox':
      return Boolean(value);
    case 'number': {
      if (value === '' || value == null) return field.name === 'sort_order' ? 0 : null;
      const n = Number(value);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    case 'datetime':
      return fromLocalInput(String(value ?? ''));
    default: {
      const s = String(value ?? '').trim();
      return s === '' ? null : s;
    }
  }
}

function RelationSelect({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { type: 'relation' }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = useAsync(async () => {
    const res = await requireSupabase()
      .from(field.table)
      .select(field.select)
      .order(field.order, { ascending: field.ascending ?? true })
      .limit(500);
    return unwrap(res) as unknown as Row[];
  }, [field.table]);

  return (
    <select id={field.name} className="field-input" value={value} required={field.required} onChange={(e) => onChange(e.target.value)}>
      <option value="">{field.required ? 'Choose…' : 'None'}</option>
      {options.data?.map((o) => (
        <option key={String(o.id)} value={String(o.id)}>
          {field.optionLabel(o)}
        </option>
      ))}
    </select>
  );
}

function ImageInput({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldDef, { type: 'image' }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = mediaUrl(value);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateMediaFile(file, false);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadMedia(file, field.folder));
    } catch (err) {
      setError(friendlyDbError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        {preview ? (
          <img src={preview} alt="" className="h-20 w-20 rounded object-cover ring-1 ring-charcoal-400/30" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded bg-chalk text-xs text-charcoal-600">No image</div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border-2 border-navy-800 px-3 py-1.5 text-sm font-semibold text-navy-800 hover:bg-navy-800 hover:text-crease">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          {busy ? 'Uploading…' : preview ? 'Replace image' : 'Upload image'}
          <input
            id={field.name}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-sm font-semibold text-cherry underline">
            Remove
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}

function FieldControl({ field, values, setValue }: { field: FieldDef; values: Row; setValue: (name: string, v: unknown) => void }) {
  const v = values[field.name];
  const common = { id: field.name, className: 'field-input' };
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          {...common}
          rows={field.rows ?? 3}
          maxLength={field.max}
          required={field.required}
          value={String(v ?? '')}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          {...common}
          type="number"
          min={field.min}
          max={field.max}
          value={String(v ?? '')}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case 'select':
      return (
        <select {...common} required={field.required} value={String(v ?? '')} onChange={(e) => setValue(field.name, e.target.value)}>
          {!field.required && <option value="">Not set</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'relation':
      return <RelationSelect field={field} value={String(v ?? '')} onChange={(nv) => setValue(field.name, nv)} />;
    case 'checkbox':
      return (
        <input
          id={field.name}
          type="checkbox"
          className="h-5 w-5 accent-navy-800"
          checked={Boolean(v)}
          onChange={(e) => setValue(field.name, e.target.checked)}
        />
      );
    case 'datetime':
      return (
        <input
          {...common}
          type="datetime-local"
          required={field.required}
          value={String(v ?? '')}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
    case 'image':
      return <ImageInput field={field} value={String(v ?? '')} onChange={(nv) => setValue(field.name, nv)} />;
    case 'slug':
      return (
        <input
          {...common}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={String(v ?? '')}
          placeholder={slugify(String(values[field.from] ?? '')) || 'created-from-the-name'}
          onChange={(e) => setValue(field.name, e.target.value.toLowerCase())}
        />
      );
    default:
      return (
        <input
          {...common}
          type={field.type === 'url' ? 'url' : 'text'}
          maxLength={field.max}
          required={field.required}
          value={String(v ?? '')}
          onChange={(e) => setValue(field.name, e.target.value)}
        />
      );
  }
}

function EditForm({
  resource,
  row,
  onCancel,
  onSaved,
}: {
  resource: ResourceDef;
  row: Row | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const initial = useMemo(() => {
    const base: Row = {};
    for (const f of resource.fields) base[f.name] = toFormValue(f, row ? row[f.name] : resource.defaults[f.name]);
    return base;
  }, [resource, row]);
  const [values, setValues] = useState<Row>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setValue = (name: string, v: unknown) => setValues((prev) => ({ ...prev, [name]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    let payload: Row = {};
    for (const f of resource.fields) {
      payload[f.name] = toDbValue(f, values[f.name]);
      if (f.type === 'slug' && !payload[f.name]) payload[f.name] = slugify(String(values[f.from] ?? ''));
      if (f.type === 'slug' && !payload[f.name]) {
        setError('Enter a name or title so a web address can be created.');
        return;
      }
    }
    if (resource.beforeSave) payload = resource.beforeSave(payload);
    setSaving(true);
    try {
      const client = requireSupabase();
      const res = row
        ? await client.from(resource.table).update(payload).eq('id', row.id as string).select('id')
        : await client.from(resource.table).insert(payload).select('id');
      if (res.error) throw new Error(res.error.message);
      if (!res.data?.length) throw new Error('permission denied');
      onSaved(row ? `Saved changes to this ${resource.singular}.` : `Added the ${resource.singular}.`);
    } catch (err) {
      setError(friendlyDbError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel className="mb-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy-900">
            {row ? `Edit ${resource.singular}` : `New ${resource.singular}`}
          </h2>
          <button type="button" onClick={onCancel} className="rounded p-1 hover:bg-chalk">
            <X aria-hidden="true" />
            <span className="sr-only">Close form</span>
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {resource.fields.map((f) => {
            const wide = f.type === 'textarea' || f.type === 'image';
            if (f.type === 'checkbox') {
              return (
                <div key={f.name} className="flex items-start gap-3 md:col-span-2">
                  <FieldControl field={f} values={values} setValue={setValue} />
                  <label htmlFor={f.name} className="-mt-0.5">
                    <span className="font-semibold">{f.label}</span>
                    {f.hint && <span className="block text-sm text-charcoal-600">{f.hint}</span>}
                  </label>
                </div>
              );
            }
            return (
              <div key={f.name} className={wide ? 'md:col-span-2' : ''}>
                <label htmlFor={f.name} className="mb-1.5 block font-semibold">
                  {f.label}
                  {'required' in f && f.required && <span className="text-cherry"> *</span>}
                </label>
                <FieldControl field={f} values={values} setValue={setValue} />
                {f.hint && <p className="mt-1 text-sm text-charcoal-600">{f.hint}</p>}
              </div>
            );
          })}
        </div>
        {error && <NoticeBar notice={{ kind: 'error', text: error }} />}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Saving…
              </>
            ) : row ? (
              'Save changes'
            ) : (
              `Add ${resource.singular}`
            )}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function CrudPage({ resource }: { resource: ResourceDef }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const list = useAsync(async () => {
    let q = requireSupabase().from(resource.table).select(resource.select).limit(200);
    for (const o of resource.order) q = q.order(o.column, { ascending: o.ascending });
    if (query) q = q.ilike(resource.searchColumn, `%${query.replace(/[%_,()]/g, ' ')}%`);
    return unwrap(await q) as unknown as Row[];
  }, [resource.table, query]);

  const imageFields = resource.fields.filter((f) => f.type === 'image').map((f) => f.name);

  const remove = async (row: Row) => {
    const name = String(row.name ?? row.title ?? row.display_name ?? row.opponent ?? `this ${resource.singular}`);
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await requireSupabase().from(resource.table).delete().eq('id', row.id as string).select('id');
    if (res.error || !res.data?.length) {
      setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
      return;
    }
    // Tidy up uploaded images that belonged to this row (best effort).
    for (const f of imageFields) {
      const path = row[f];
      if (typeof path === 'string' && path && !path.startsWith('http')) void deleteMedia(path).catch(() => {});
    }
    setNotice({ kind: 'success', text: `Deleted ${name}.` });
    list.reload();
  };

  return (
    <div>
      <AdminPageHeader
        title={resource.title}
        intro={resource.intro}
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add {resource.singular}
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      {editing && (
        <EditForm
          key={editing === 'new' ? 'new' : String(editing.id)}
          resource={resource}
          row={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={(text) => {
            setEditing(null);
            setNotice({ kind: 'success', text });
            list.reload();
          }}
        />
      )}
      <Panel>
        <label className="relative mb-4 block max-w-sm">
          <span className="sr-only">Search {resource.title.toLowerCase()}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
          <input
            type="search"
            className="field-input pl-9"
            placeholder={`Search ${resource.title.toLowerCase()}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {list.loading && !list.data ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data?.length ? (
          <p className="py-8 text-center text-charcoal-600">
            {query ? 'Nothing matches your search.' : `No ${resource.title.toLowerCase()} yet. Use “Add ${resource.singular}” to create one.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-charcoal-400/30 text-charcoal-600">
                  {resource.columns.map((c) => (
                    <th key={c.label} scope="col" className="py-2 pr-4 font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th scope="col" className="py-2 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((row) => (
                  <tr key={String(row.id)} className="border-b border-charcoal-400/15 last:border-0 hover:bg-chalk/60">
                    {resource.columns.map((c) => {
                      const p = c.pill?.(row);
                      return (
                        <td key={c.label} className="py-2.5 pr-4 align-top">
                          {p ? <Pill value={p.value} label={p.label} /> : c.render(row)}
                        </td>
                      );
                    })}
                    <td className="py-2 text-right whitespace-nowrap">
                      {resource.rowLinks?.map((l) => (
                        <Link
                          key={l.label}
                          to={l.to(row)}
                          className="mr-1 inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-navy-800 hover:bg-navy-800/10"
                        >
                          {l.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(row);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-navy-800 hover:bg-navy-800/10"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(row)}
                        className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-cherry hover:bg-cherry/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
