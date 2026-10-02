'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-16">
      <h1 className="font-display font-extrabold text-xl mb-5">Sign in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="text-coral text-[12.5px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-amber text-ink font-display font-extrabold rounded-xl py-3 text-[14.5px] disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-[12.5px] text-muted">
          New here?{' '}
          <a href="/signup" className="text-teal font-semibold">
            Create an account
          </a>
        </p>
      </form>
    </div>
  );
}
