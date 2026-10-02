'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { calculateAge, MIN_AGE } from '../../lib/age';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    handle: '',
    country: '',
    birthDate: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Client-side check first, for a fast/clear message. The database
    // trigger (enforce_min_age) is the real, unbypassable enforcement.
    const age = calculateAge(form.birthDate);
    if (age === null || age < MIN_AGE) {
      setError(`You must be at least ${MIN_AGE} years old to join.`);
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms and Privacy Policy to continue.');
      return;
    }

    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      // Email confirmation is likely required before a session exists.
      setError(null);
      setLoading(false);
      alert('Check your email to confirm your account, then sign in.');
      router.push('/login');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      handle: form.handle.trim().toLowerCase(),
      display_name: form.displayName,
      birth_date: form.birthDate,
      country: form.country,
    });

    setLoading(false);

    if (profileError) {
      // Covers: handle already taken, or the database's own age-trigger firing
      // if someone bypasses the client-side check.
      setError(profileError.message);
      return;
    }

    router.push('/');
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-16">
      <h1 className="font-display font-extrabold text-xl mb-1">Create your account</h1>
      <p className="text-muted text-[12.5px] mb-5">You must be {MIN_AGE} or older to join Tubambe.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Display name">
          <input
            type="text"
            required
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Handle">
          <input
            type="text"
            required
            placeholder="e.g. amara.k"
            value={form.handle}
            onChange={(e) => update('handle', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Country">
          <input
            type="text"
            value={form.country}
            onChange={(e) => update('country', e.target.value)}
            className="input"
            placeholder="e.g. Kenya"
          />
        </Field>

        <Field label={`Date of birth (must be ${MIN_AGE}+)`}>
          <input
            type="date"
            required
            value={form.birthDate}
            onChange={(e) => update('birthDate', e.target.value)}
            className="input"
          />
        </Field>

        <label className="flex items-start gap-2 text-[12.5px] text-muted">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-teal">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-teal">Privacy Policy</a>.
          </span>
        </label>

        {error && <p className="text-coral text-[12.5px]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="bg-amber text-ink font-display font-extrabold rounded-xl py-3 text-[14.5px] disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="text-center text-[12.5px] text-muted">
          Already have an account?{' '}
          <a href="/login" className="text-teal font-semibold">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
