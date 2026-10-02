'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icons';

const REASONS = [
  'Spam or misleading',
  'Nudity or sexual content',
  'Violence or dangerous acts',
  'Hate speech or harassment',
  'Misinformation',
  'Underage user',
  'Something else',
];

// targetType: 'video' | 'comment' | 'profile'
export default function ReportModal({ targetType, targetId, reporterId, onClose }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!reason) return;
    setSending(true);
    setError(null);

    const row = { reporter_id: reporterId, reason, details: details || null };
    if (targetType === 'video') row.video_id = targetId;
    if (targetType === 'comment') row.comment_id = targetId;
    if (targetType === 'profile') row.reported_user_id = targetId;

    const { error } = await supabase.from('reports').insert(row);
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(onClose, 1400);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base">Report {targetType}</h3>
          <button onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>

        {done ? (
          <p className="text-teal text-sm py-4 text-center">Thanks — our team will review this.</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Anything else that would help us review this? (optional)"
              className="input min-h-[60px]"
            />
            {error && <p className="text-coral text-xs">{error}</p>}
            <button
              type="submit"
              disabled={!reason || sending}
              className="bg-amber text-ink font-display font-extrabold rounded-xl py-2.5 text-[13.5px] disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Submit report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
