'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/AuthContext';
import { loadProfile } from '../../../lib/profiles';
import ProfileView from '../../../components/ProfileView';

export default function PublicProfilePage() {
  const { handle } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    loadProfile({ handle: decodeURIComponent(handle), viewerId: user?.id }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [handle, authLoading, user?.id]);

  async function toggleFollow() {
    if (!user) return router.push('/login');

    if (!data.followStatus) {
      // Not following yet: public accounts get instant 'accepted', private
      // accounts get a 'pending' request the owner must approve.
      const status = data.profile.is_private ? 'pending' : 'accepted';
      setData((d) => ({
        ...d,
        followStatus: status,
        followers: status === 'accepted' ? d.followers + 1 : d.followers,
      }));
      await supabase.from('follows').insert({ follower_id: user.id, following_id: data.profile.id, status });
    } else {
      // Already following, or a pending request — either way, remove it.
      const wasAccepted = data.followStatus === 'accepted';
      setData((d) => ({ ...d, followStatus: null, followers: wasAccepted ? Math.max(0, d.followers - 1) : d.followers }));
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: data.profile.id });
    }
  }

  async function handleBlock() {
    if (!user) return router.push('/login');
    if (!window.confirm(`Block @${data.profile.handle}? You won't see each other's videos anymore.`)) return;
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: data.profile.id });
    if (error) alert(error.message);
    else router.push('/explore');
  }

  if (authLoading || loading) return <p className="text-center text-muted text-sm pt-10">Loading…</p>;

  if (!data) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Creator not found</p>
        <Link href="/explore" className="text-teal font-semibold text-sm">
          Back to Explore →
        </Link>
      </div>
    );
  }

  return <ProfileView {...data} viewerId={user?.id} onToggleFollow={toggleFollow} onBlock={handleBlock} />;
}
