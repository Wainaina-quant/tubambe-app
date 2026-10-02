'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import { loadProfile } from '../../lib/profiles';
import ProfileView from '../../components/ProfileView';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadProfile({ id: user.id, viewerId: user.id }).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [authLoading, user]);

  if (authLoading || loading) return <p className="text-center text-muted text-sm pt-10">Loading…</p>;

  if (!user) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Not signed in</p>
        <Link href="/login" className="text-teal font-semibold text-sm">
          Go to sign in →
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Profile not found</p>
        <p className="text-muted text-sm">
          Your account exists but has no row in <code>profiles</code> yet — this shouldn't happen if you signed up
          through /signup.
        </p>
      </div>
    );
  }

  return <ProfileView {...data} />;
}
