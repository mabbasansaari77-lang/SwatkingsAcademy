import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ErrorState, Loading } from '../components/ui/States';
import { formatDateTime } from '../lib/format';
import { requireSupabase } from '../lib/supabase';
import type { ContactMessage } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { EMAIL_PATTERN } from '../lib/validation';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

export default function Messages() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const list = useAsync(async () => {
    let q = requireSupabase().from('contact_messages').select('*').order('created_at', { ascending: false }).limit(300);
    if (filter === 'unread') q = q.eq('is_read', false);
    return unwrap(await q) as ContactMessage[];
  }, [filter]);

  const setRead = async (m: ContactMessage, is_read: boolean) => {
    const res = await requireSupabase().from('contact_messages').update({ is_read }).eq('id', m.id).select('id');
    if (res.error || !res.data?.length) setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else list.reload();
  };

  const toggle = (m: ContactMessage) => {
    const opening = openId !== m.id;
    setOpenId(opening ? m.id : null);
    if (opening && !m.is_read) void setRead(m, true);
  };

  const remove = async (m: ContactMessage) => {
    if (!window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return;
    const res = await requireSupabase().from('contact_messages').delete().eq('id', m.id).select('id');
    if (res.error || !res.data?.length) setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else {
      setNotice({ kind: 'success', text: 'Message deleted.' });
      list.reload();
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        intro="Messages from the contact form. No email notifications are sent — check this inbox regularly."
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      <div role="group" aria-label="Filter messages" className="mb-4 flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full border-2 px-4 py-1 text-sm font-semibold ${
              filter === f ? 'border-navy-800 bg-navy-800 text-crease' : 'border-navy-800/30 text-navy-800'
            }`}
          >
            {f === 'all' ? 'All messages' : 'Unread'}
          </button>
        ))}
      </div>
      <Panel className="p-0">
        {list.loading && !list.data ? (
          <div className="p-5"><Loading /></div>
        ) : list.error ? (
          <div className="p-5"><ErrorState error={list.error} onRetry={list.reload} /></div>
        ) : !list.data?.length ? (
          <p className="p-8 text-center text-charcoal-600">{filter === 'unread' ? 'No unread messages.' : 'No messages yet.'}</p>
        ) : (
          <ul>
            {list.data.map((m) => {
              const open = openId === m.id;
              const isEmail = EMAIL_PATTERN.test(m.contact);
              return (
                <li key={m.id} className="border-b border-charcoal-400/15 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggle(m)}
                    aria-expanded={open}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-chalk/60"
                  >
                    {m.is_read ? (
                      <MailOpen className="mt-1 h-4 w-4 shrink-0 text-charcoal-400" aria-label="Read" />
                    ) : (
                      <Mail className="mt-1 h-4 w-4 shrink-0 text-accent-700" aria-label="Unread" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate ${m.is_read ? '' : 'font-bold'}`}>{m.subject}</span>
                      <span className="block truncate text-sm text-charcoal-600">
                        {m.name} — {formatDateTime(m.created_at)}
                      </span>
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pl-12">
                      <p className="whitespace-pre-line text-charcoal-800">{m.message}</p>
                      <p className="mt-3 text-sm">
                        Reply to:{' '}
                        <a
                          href={isEmail ? `mailto:${m.contact}?subject=${encodeURIComponent(`Re: ${m.subject}`)}` : `tel:${m.contact.replace(/[^0-9+]/g, '')}`}
                          className="font-semibold text-navy-800 underline underline-offset-4"
                        >
                          {m.contact}
                        </a>
                      </p>
                      <div className="mt-3 flex gap-4 text-sm">
                        <button type="button" onClick={() => void setRead(m, !m.is_read)} className="font-semibold text-navy-800 underline">
                          Mark as {m.is_read ? 'unread' : 'read'}
                        </button>
                        <button type="button" onClick={() => void remove(m)} className="inline-flex items-center gap-1 font-semibold text-cherry">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
