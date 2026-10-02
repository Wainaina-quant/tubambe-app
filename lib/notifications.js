import { supabase } from './supabaseClient';

export const NOTIFICATION_SELECT = '*, actor:actor_id(handle, display_name)';

export function notificationText(n) {
  switch (n.type) {
    case 'like': return 'liked your video';
    case 'repost': return 'reposted your video';
    case 'comment': return 'commented on your video';
    case 'reply': return 'replied to your comment';
    case 'comment_like': return 'liked your comment';
    case 'follow': return 'started following you';
    case 'follow_request': return 'requested to follow you';
    case 'follow_accept': return 'accepted your follow request';
    case 'new_video': return 'posted a new video';
    default: return 'interacted with you';
  }
}

export async function markAllRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('recipient_id', userId).eq('read', false);
}
