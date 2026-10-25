import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { ErrorState, Loading } from '../components/ui/States';
import { useSettings } from '../lib/settings';
import { requireSupabase } from '../lib/supabase';
import type { SiteSettings } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

type Key = keyof Omit<SiteSettings, 'id' | 'updated_at' | 'registration_open'>;

interface SettingField {
  key: Key;
  label: string;
  type?: 'textarea' | 'url' | 'email' | 'tel';
  max: number;
  hint?: string;
  rows?: number;
  required?: boolean;
}

const GROUPS: { title: string; intro: string; fields: SettingField[] }[] = [
  {
    title: 'Home page',
    intro: 'The hero headline and introduction visitors see first.',
    fields: [
      { key: 'academy_name', label: 'Academy name', max: 120, required: true },
      { key: 'hero_headline', label: 'Hero headline', max: 120, required: true },
      { key: 'hero_subheading', label: 'Hero subheading', type: 'textarea', max: 300, rows: 2, required: true },
      { key: 'intro_text', label: 'Introduction', type: 'textarea', max: 2000, rows: 4, hint: 'Leave empty to use the default wording. Separate paragraphs with a blank line.' },
    ],
  },
  {
    title: 'About page',
    intro: 'Only include facts you can confirm. Do not add achievements or numbers that are not real.',
    fields: [
      { key: 'about_text', label: 'Our story', type: 'textarea', max: 8000, rows: 6 },
      { key: 'mission_text', label: 'Mission', type: 'textarea', max: 2000, rows: 3 },
      { key: 'philosophy_text', label: 'Training philosophy', type: 'textarea', max: 4000, rows: 4, hint: 'Shown above the four values (Skill, Discipline, Confidence, Teamwork).' },
    ],
  },
  {
    title: 'Contact details',
    intro: 'Shown in the footer and on the Contact page. Leave a field empty to hide it.',
    fields: [
      { key: 'address', label: 'Academy address', type: 'textarea', max: 300, rows: 2 },
      { key: 'phone', label: 'Phone number', type: 'tel', max: 30, hint: 'e.g. +92 300 1234567' },
      { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', max: 30, hint: 'Include the country code so the WhatsApp link works.' },
      { key: 'email', label: 'Email address', type: 'email', max: 254 },
      { key: 'map_url', label: 'Map link', type: 'url', max: 500, hint: 'Paste a Google Maps share link (must start with https://).' },
      { key: 'training_schedule', label: 'Training times', type: 'textarea', max: 2000, rows: 3 },
    ],
  },
  {
    title: 'Social media',
    intro: 'Full links starting with https://. Icons appear in the footer only for links you add.',
    fields: [
      { key: 'facebook_url', label: 'Facebook', type: 'url', max: 500 },
      { key: 'instagram_url', label: 'Instagram', type: 'url', max: 500 },
      { key: 'youtube_url', label: 'YouTube', type: 'url', max: 500 },
      { key: 'tiktok_url', label: 'TikTok', type: 'url', max: 500 },
    ],
  },
];

function SettingsForm({ initial, onSaved }: { initial: SiteSettings; onSaved: () => void }) {
  const [values, setValues] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    const payload: Record<string, unknown> = { registration_open: values.registration_open };
    for (const g of GROUPS)
      for (const f of g.fields) {
        const v = String(values[f.key] ?? '').trim();
        if (f.type === 'url' && v && !/^https:\/\//.test(v)) {
          setNotice({ kind: 'error', text: `${f.label}: links must start with https://` });
          return;
        }
        payload[f.key] = v === '' ? null : v;
      }
    setSaving(true);
    const res = await requireSupabase().from('site_settings').update(payload).eq('id', 1).select('id');
    setSaving(false);
    if (res.error || !res.data?.length) {
      setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
      return;
    }
    setNotice({ kind: 'success', text: 'Website settings saved. Changes are live now.' });
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <Panel>
        <h2 className="text-2xl font-extrabold text-navy-900">Registrations</h2>
        <label className="mt-3 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-navy-800"
            checked={values.registration_open}
            onChange={(e) => setValues((v) => ({ ...v, registration_open: e.target.checked }))}
          />
          <span>
            <span className="font-semibold">Accept new registrations</span>
            <span className="block text-sm text-charcoal-600">When off, the form is hidden and the database rejects new registrations.</span>
          </span>
        </label>
      </Panel>
      {GROUPS.map((g) => (
        <Panel key={g.title}>
          <h2 className="text-2xl font-extrabold text-navy-900">{g.title}</h2>
          <p className="mb-4 text-sm text-charcoal-600">{g.intro}</p>
          <div className="grid gap-5 md:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label htmlFor={`s-${f.key}`} className="mb-1.5 block font-semibold">
                  {f.label}
                  {f.required && <span className="text-cherry"> *</span>}
                </label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={`s-${f.key}`}
                    rows={f.rows ?? 3}
                    maxLength={f.max}
                    required={f.required}
                    className="field-input"
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    id={`s-${f.key}`}
                    type={f.type ?? 'text'}
                    maxLength={f.max}
                    required={f.required}
                    className="field-input"
                    value={String(values[f.key] ?? '')}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                )}
                {f.hint && <p className="mt-1 text-sm text-charcoal-600">{f.hint}</p>}
              </div>
            ))}
          </div>
        </Panel>
      ))}
      <div className="sticky bottom-0 -mx-4 border-t border-charcoal-400/20 bg-chalk/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  );
}

export default function SettingsAdmin() {
  const { reload: reloadPublic } = useSettings();
  const state = useAsync(async () => {
    const res = await requireSupabase().from('site_settings').select('*').eq('id', 1).single();
    return unwrap(res) as SiteSettings;
  });

  return (
    <div>
      <AdminPageHeader title="Website settings" intro="Edit the academy’s public information. Leave anything you have not confirmed empty." />
      {state.loading && !state.data ? (
        <Loading />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : (
        state.data && <SettingsForm initial={state.data} onSaved={reloadPublic} />
      )}
    </div>
  );
}
