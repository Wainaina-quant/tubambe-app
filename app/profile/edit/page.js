'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/AuthContext';
import Icon from '../../../components/Icons';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState(null); // null until loaded
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setForm(data));
  }, [authLoading, user]);

  if (authLoading || (user && !form)) return <p className="text-center text-muted text-sm pt-10">Loading…</p>;

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

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let avatarUrl = form.avatar_url;

      if (avatarFile) {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        const path = `${user.id}/${Date.now()}-${avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: SUPABASE_ANON_KEY,
            'Content-Type': avatarFile.type || 'image/jpeg',
          },
          body: avatarFile,
        });
        if (!res.ok) throw new Error('Avatar upload failed.');
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name,
          country: form.country,
          bio: form.bio,
          is_private: form.is_private,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (dbError) throw dbError;
      setDone(true);
      setTimeout(() => router.push('/profile'), 700);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-10">
      <h1 className="font-display font-extrabold text-xl mb-5">Edit profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-teal to-amber flex items-center justify-center font-display font-extrabold text-3xl text-ink relative">
            {avatarPreview || form.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview || form.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              form.display_name?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <label className="text-[12.5px] text-teal font-semibold flex items-center gap-1.5 cursor-pointer">
            <Icon name="camera" size={14} />
            {form.avatar_url || avatarPreview ? 'Change photo' : 'Add photo (optional)'}
            <input type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
          </label>
        </div>

        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Display name</label>
          <input value={form.display_name} onChange={(e) => update('display_name', e.target.value)} className="input" required />
        </div>

        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Bio</label>
          <textarea
            value={form.bio || ''}
            onChange={(e) => update('bio', e.target.value)}
            maxLength={200}
            placeholder="A short bio — links are shown as tappable text"
            className="input min-h-[80px]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Country</label>
          <input value={form.country || ''} onChange={(e) => update('country', e.target.value)} className="input" />
        </div>

        <div className="flex items-center justify-between bg-surface-2 rounded-xl px-3.5 py-3">
          <div>
            <p className="text-[13.5px] font-bold flex items-center gap-1.5">
              <Icon name="lock" size={14} /> Private account
            </p>
            <p className="text-[11.5px] text-muted mt-0.5">Only approved followers can see your videos.</p>
          </div>
          <button
            type="button"
            onClick={() => update('is_private', !form.is_private)}
            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${form.is_private ? 'bg-teal' : 'bg-white/15'}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-cream transition-transform ${
                form.is_private ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {error && <p className="text-coral text-xs">{error}</p>}
        {done && <p className="text-teal text-xs">Saved!</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-amber text-ink font-display font-extrabold rounded-xl py-3 text-[14.5px] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px]">
        <Link href="/blocked" className="text-muted font-semibold">Blocked accounts</Link>
        <Link href="/terms" className="text-muted font-semibold">Terms</Link>
        <Link href="/privacy" className="text-muted font-semibold">Privacy</Link>
        <Link href="/guidelines" className="text-muted font-semibold">Guidelines</Link>
      </div>
    </div>
  );
}
