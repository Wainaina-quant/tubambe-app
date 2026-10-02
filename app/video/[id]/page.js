'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/AuthContext';
import { VIDEO_SELECT, attachMyState } from '../../../lib/videos';
import { getRememberedVideoList } from '../../../lib/videoContext';
import VideoFeed from '../../../components/VideoFeed';

export default function SingleVideoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      const rememberedIds = getRememberedVideoList();

      let rows = [];
      if (rememberedIds && rememberedIds.includes(id)) {
        const { data } = await supabase.from('videos').select(VIDEO_SELECT).in('id', rememberedIds);
        const byId = Object.fromEntries((data || []).map((v) => [v.id, v]));
        rows = rememberedIds.map((vid) => byId[vid]).filter(Boolean); // keep original order
      } else {
        // No remembered context (e.g. a shared link opened fresh) — fall
        // back to scrolling through this creator's other videos.
        const { data: target } = await supabase.from('videos').select(VIDEO_SELECT).eq('id', id).maybeSingle();
        if (target) {
          const { data: creatorVids } = await supabase
            .from('videos')
            .select(VIDEO_SELECT)
            .eq('creator_id', target.creator_id)
            .order('created_at', { ascending: false });
          rows = creatorVids && creatorVids.length ? creatorVids : [target];
        }
      }

      if (cancelled) return;
      if (rows.length === 0) {
        setNotFound(true);
        return;
      }
      const withState = await attachMyState(rows, user?.id);
      setVideos(withState);
      setInitialIndex(Math.max(0, withState.findIndex((v) => v.id === id)));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, authLoading, user?.id]);

  if (notFound) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Video not found</p>
        <Link href="/" className="text-teal font-semibold text-sm">
          Back to feed →
        </Link>
      </div>
    );
  }

  if (!videos) return <p className="text-center text-muted text-sm pt-10">Loading…</p>;

  return (
    <VideoFeed
      videos={videos}
      currentUserId={user?.id || null}
      initialIndex={initialIndex}
      onBack={() => router.back()}
    />
  );
}
