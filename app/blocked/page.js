'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';

export default function BlockedPage() {
  const { user, loading: authLoading } = useAuth();
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from('blocks')
      .select('blocked_id, profiles!blocks_blocked_id_fkey(handle, display_name)')
      .eq('blocker_id', user.id)
      .then(({ data }) => {
        setBlocked(data || []);
        setLoading(false);
      });
  }, [authLoading, user]);

  async function unblock(blockedId) {
    await supabase.from('blocks').delete().match({ blocker_id: user.id, blocked_id: blockedId });
    setBlocked((b) => b.filter((row) => row.blocked_id !== blockedId));
  }

  if (authLoading) return null;
  if (!user) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Sign in first</p>
        <Link href="/login" className="text-teal font-semibold text-sm">
          Go to sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-10">
      <h1 className="font-display font-extrabold text-xl mb-5">Blocked accounts</h1>
      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : blocked.length === 0 ? (
        <p className="text-muted text-sm">You haven't blocked anyone.</p>
      ) : (
        <div className="flex flex-col">
          {blocked.map((row) => (
            <div key={row.blocked_id} className="flex items-center justify-between py-2.5 border-b border-white/5">
              <span className="text-[13.5px] font-semibold">@{row.profiles?.handle}</span>
              <button onClick={() => unblock(row.blocked_id)} className="text-teal text-[12.5px] font-semibold">
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
