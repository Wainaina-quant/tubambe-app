'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import Icon from '../../components/Icons';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(!!data?.is_admin));
  }, [authLoading, user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  async function loadReports() {
    setLoading(true);
    let query = supabase
      .from('reports')
      .select(
        'id, reason, details, status, created_at, video_id, comment_id, reported_user_id, reporter:reporter_id(handle), reported:reported_user_id(handle)'
      )
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) console.error(error);
    setReports(data || []);
    setLoading(false);
  }

  async function setStatus(id, status) {
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    await supabase.from('reports').update({ status }).eq('id', id);
  }

  async function removeContent(report) {
    if (!confirm('Delete this content permanently? This cannot be undone.')) return;
    if (report.video_id) await supabase.from('videos').delete().eq('id', report.video_id);
    if (report.comment_id) await supabase.from('comments').delete().eq('id', report.comment_id);
    await setStatus(report.id, 'reviewed');
  }

  if (authLoading || isAdmin === null) return <p className="text-center text-muted text-sm pt-10">Loading…</p>;

  if (!user || !isAdmin) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Admins only</p>
        <p className="text-muted text-sm mb-3">
          This page is restricted. To make your own account an admin, run this once in the
          Supabase SQL Editor (replace the handle):
        </p>
        <code className="block bg-surface-2 rounded-lg p-3 text-[11.5px] text-left max-w-sm mx-auto">
          update profiles set is_admin = true where handle = 'your_handle';
        </code>
        <Link href="/" className="text-teal font-semibold text-sm block mt-4">
          Back to feed →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
      <h1 className="font-display font-extrabold text-xl mb-1">Reports</h1>
      <p className="text-muted text-[12.5px] mb-4">Moderation queue — review and act on user reports.</p>

      <div className="flex gap-2 mb-4">
        {['open', 'reviewed', 'dismissed', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold border ${
              filter === f ? 'bg-amber text-ink border-amber' : 'bg-surface-2 text-cream border-white/10'
            }`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-muted text-sm">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-surface-2 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="text-[13px] font-bold">{r.reason}</span>
                  <span className="text-[11px] text-muted ml-2">
                    {r.video_id ? 'Video' : r.comment_id ? 'Comment' : 'Profile'} ·{' '}
                    {timeAgo(r.created_at)}
                  </span>
                </div>
                <span
                  className={`text-[10.5px] font-bold rounded-full px-2 py-0.5 shrink-0 ${
                    r.status === 'open'
                      ? 'bg-coral/20 text-coral'
                      : r.status === 'reviewed'
                      ? 'bg-teal/20 text-teal'
                      : 'bg-white/10 text-muted'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              {r.details && <p className="text-[12.5px] text-cream/85 mb-1.5">{r.details}</p>}

              <p className="text-[11.5px] text-muted mb-2.5">
                Reported by @{r.reporter?.handle || 'unknown'}
                {r.reported?.handle && <> · About @{r.reported.handle}</>}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                {r.video_id && (
                  <Link href={`/video/${r.video_id}`} className="text-[11.5px] text-teal font-semibold">
                    View video
                  </Link>
                )}
                {r.reported?.handle && (
                  <Link href={`/u/${r.reported.handle}`} className="text-[11.5px] text-teal font-semibold">
                    View profile
                  </Link>
                )}
                <span className="flex-1" />
                {(r.video_id || r.comment_id) && (
                  <button
                    onClick={() => removeContent(r)}
                    className="flex items-center gap-1 text-[11.5px] text-coral font-semibold"
                  >
                    <Icon name="x" size={12} /> Remove content
                  </button>
                )}
                {r.status !== 'dismissed' && (
                  <button onClick={() => setStatus(r.id, 'dismissed')} className="text-[11.5px] text-muted font-semibold">
                    Dismiss
                  </button>
                )}
                {r.status !== 'reviewed' && (
                  <button onClick={() => setStatus(r.id, 'reviewed')} className="text-[11.5px] text-cream font-semibold">
                    Mark reviewed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
