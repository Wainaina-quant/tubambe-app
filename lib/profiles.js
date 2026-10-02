import { supabase } from './supabaseClient';

// Loads a profile plus everything its page needs: posts (respecting privacy
// via RLS — private accounts simply won't return rows to non-followers),
// saved videos and reposts (only meaningful for the viewer's own profile),
// follower/following counts, and the viewer's relationship to this person.
export async function loadProfile({ id, handle, viewerId }) {
  let query = supabase.from('profiles').select('*');
  query = id ? query.eq('id', id) : query.eq('handle', String(handle).toLowerCase());
  const { data: profile } = await query.maybeSingle();
  if (!profile) return null;

  const isOwn = viewerId === profile.id;

  const [vids, followers, following, relation] = await Promise.all([
    supabase
      .from('videos')
      .select('*')
      .eq('creator_id', profile.id)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted'),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('status', 'accepted'),
    viewerId
      ? supabase.from('follows').select('status').eq('follower_id', viewerId).eq('following_id', profile.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let saved = [];
  let reposted = [];
  if (isOwn) {
    const [savesRes, repostsRes] = await Promise.all([
      supabase.from('saves').select('video_id, videos(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('reposts').select('video_id, videos(*)').eq('user_id', profile.id).order('created_at', { ascending: false }),
    ]);
    saved = (savesRes.data || []).map((r) => r.videos).filter(Boolean);
    reposted = (repostsRes.data || []).map((r) => r.videos).filter(Boolean);
  }

  // videos may come back empty either because there genuinely are none, or
  // because RLS blocked them (private account, not an accepted follower).
  const canView = !profile.is_private || isOwn || relation.data?.status === 'accepted';

  return {
    profile,
    videos: vids.data || [],
    saved,
    reposted,
    followers: followers.count || 0,
    following: following.count || 0,
    followStatus: relation.data?.status || null, // 'accepted' | 'pending' | null
    canView,
    isOwn,
  };
}
