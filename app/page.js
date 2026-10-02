'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { VIDEO_SELECT, attachMyState } from '../lib/videos';
import VideoFeed from '../components/VideoFeed';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('videos')
        .select(VIDEO_SELECT)
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      const withState = await attachMyState(data || [], user?.id);
      if (!cancelled) {
        setVideos(withState);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  if (loading) {
    return <div className="h-full flex items-center justify-center text-muted text-sm">Loading feed…</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-2">
        <p className="font-display font-bold text-lg">No videos yet</p>
        <p className="text-muted text-sm">Be the first — tap Upload and post something.</p>
      </div>
    );
  }

  return <VideoFeed videos={videos} currentUserId={user?.id || null} />;
}
