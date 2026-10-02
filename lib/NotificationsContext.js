'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';

const Ctx = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  async function refresh() {
    if (!user) return setUnreadCount(0);
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  }

  useEffect(() => {
    refresh();
    if (!user) return;

    // Realtime updates the badge the moment something new happens —
    // requires `alter publication supabase_realtime add table notifications`
    // (included in schema.sql). Falls back gracefully to refresh-on-load
    // if realtime isn't enabled on the project.
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        () => setUnreadCount((c) => c + 1)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return <Ctx.Provider value={{ unreadCount, refresh }}>{children}</Ctx.Provider>;
}

export const useNotifications = () => useContext(Ctx);
