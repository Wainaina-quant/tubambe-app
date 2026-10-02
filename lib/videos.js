import { supabase } from './supabaseClient';

// One query returns the video, its creator, and real like/comment/repost counts.
export const VIDEO_SELECT =
  '*, profiles(handle, display_name), likes(count), comments(count), reposts(count)';

// Marks which videos the signed-in viewer has already liked / reposted / saved,
// so the heart, repost, and bookmark icons stay filled after a refresh.
export async function attachMyState(videos, userId) {
  if (!userId || videos.length === 0) {
    return videos.map((v) => ({ ...v, _liked: false, _reposted: false, _saved: false }));
  }
  const ids = videos.map((v) => v.id);
  const [likes, reposts, saves] = await Promise.all([
    supabase.from('likes').select('video_id').eq('user_id', userId).in('video_id', ids),
    supabase.from('reposts').select('video_id').eq('user_id', userId).in('video_id', ids),
    supabase.from('saves').select('video_id').eq('user_id', userId).in('video_id', ids),
  ]);
  const likedSet = new Set((likes.data || []).map((r) => r.video_id));
  const repostedSet = new Set((reposts.data || []).map((r) => r.video_id));
  const savedSet = new Set((saves.data || []).map((r) => r.video_id));
  return videos.map((v) => ({
    ...v,
    _liked: likedSet.has(v.id),
    _reposted: repostedSet.has(v.id),
    _saved: savedSet.has(v.id),
  }));
}

export function formatCount(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n || 0);
}

// Fire-and-forget: counts a view once a video has actually been on screen
// for a moment (see VideoCard), not on every scroll-past.
export function registerView(videoId) {
  supabase.rpc('increment_video_views', { vid: videoId }).then(({ error }) => {
    if (error) console.error('view count:', error.message);
  });
}
