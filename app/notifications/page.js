'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { useNotifications } from '../../lib/NotificationsContext';
import { NOTIFICATION_SELECT, notificationText, markAllRead } from '../../lib/notifications';
import Icon from '../../components/Icons';

const ICONS = {
  like: 'heart',
  repost: 'repeat',
  comment: 'message',
  reply: 'message',
  comment_like: 'heart',
  follow: 'user-plus',
  follow_request: 'user-plus',
  follow_accept: 'user-check',
  new_video: 'compass',
};

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { refresh } = useNotifications();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      const { data, error } = await supabase
        .from('notifications')
        .select(NOTIFICATION_SELECT)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) console.error(error);
      setItems(data || []);
      setLoading(false);
      await markAllRead(user.id);
      refresh();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function respondToRequest(notification, accept) {
    if (accept) {
      await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .match({ follower_id: notification.actor_id, following_id: user.id });
    } else {
      await supabase.from('follows').delete().match({ follower_id: notification.actor_id, following_id: user.id });
    }
    setItems((its) => its.filter((i) => i.id !== notification.id));
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Sign in to see notifications</p>
        <Link href="/login" className="text-teal font-semibold text-sm">
          Go to sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-8">
      <h1 className="font-display font-extrabold text-xl mb-4 px-1">Notifications</h1>

      {loading ? (
        <p className="text-muted text-sm px-1">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-muted text-sm px-1">Nothing yet — likes, comments, and follows will show up here.</p>
      ) : (
        <div className="flex flex-col">
          {items.map((n) => (
            <div key={n.id} className="flex items-center gap-3 py-3 border-b border-white/5">
              <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-muted shrink-0">
                <Icon name={ICONS[n.type] || 'bell'} size={17} />
              </span>

              <Link href={`/u/${n.actor?.handle}`} className="flex-1 min-w-0 text-[13.5px] leading-snug">
                <span className="font-bold">@{n.actor?.handle || 'someone'}</span>{' '}
                <span className="text-cream/85">{notificationText(n)}</span>{' '}
                <span className="text-muted text-[11.5px]">· {timeAgo(n.created_at)}</span>
              </Link>

              {n.type === 'follow_request' ? (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => respondToRequest(n, true)}
                    className="bg-amber text-ink text-[11.5px] font-bold rounded-full px-3 py-1.5"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respondToRequest(n, false)}
                    className="bg-surface-2 text-cream text-[11.5px] font-bold rounded-full px-3 py-1.5"
                  >
                    Decline
                  </button>
                </div>
              ) : n.video_id ? (
                <Link href={`/video/${n.video_id}`} className="shrink-0">
                  <span className="w-10 h-14 rounded bg-surface-2 block" />
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
