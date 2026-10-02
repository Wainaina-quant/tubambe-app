'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import EmojiPicker from '../../components/EmojiPicker';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAX_MB = 50; // Supabase free-plan per-file limit, as far as we know — raise if you upgrade

const STAGES = { idle: null, preparing: 'Preparing…', uploading: 'Uploading video…', saving: 'Saving post…', done: 'Posted!' };

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [stage, setStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="text-center px-8 pt-10">
        <p className="font-display font-bold text-lg mb-2">Sign in to post</p>
        <Link href="/login" className="text-teal font-semibold text-sm">
          Go to sign in →
        </Link>
      </div>
    );
  }

  function handleFile(e) {
    const chosen = e.target.files?.[0] || null;
    setError(null);
    setStage('idle');
    if (chosen && chosen.size > MAX_MB * 1024 * 1024) {
      setError(`That video is ${(chosen.size / 1024 / 1024).toFixed(0)} MB — the limit is ${MAX_MB} MB.`);
      setFile(null);
      setPreviewUrl(null);
      e.target.value = '';
      return;
    }
    setFile(chosen);
    setPreviewUrl(chosen ? URL.createObjectURL(chosen) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError('Choose a video file first.');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Session expired — sign in again.');

      setStage('preparing');
      const { blob: thumbBlob, duration } = await captureThumbnail(file);

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const base = `${user.id}/${Date.now()}`;
      const videoPath = `${base}-${safeName}`;
      setStage('uploading');
      await uploadWithProgress(`${SUPABASE_URL}/storage/v1/object/videos/${videoPath}`, file, accessToken, setProgress);
      const { data: videoUrlData } = supabase.storage.from('videos').getPublicUrl(videoPath);

      let thumbnailUrl = null;
      if (thumbBlob) {
        const thumbPath = `${base}-thumb.jpg`;
        const { error: thumbError } = await supabase.storage.from('videos').upload(thumbPath, thumbBlob, { contentType: 'image/jpeg' });
        if (!thumbError) thumbnailUrl = supabase.storage.from('videos').getPublicUrl(thumbPath).data.publicUrl;
      }

      setStage('saving');
      const { error: dbError } = await supabase.from('videos').insert({
        creator_id: user.id,
        caption,
        video_url: videoUrlData.publicUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: duration,
        is_monetized: true,
      });
      if (dbError) throw dbError;

      setStage('done');
      setFile(null);
      setPreviewUrl(null);
      setCaption('');
      setProgress(0);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setStage('idle');
    }
  }

  const busy = stage !== 'idle' && stage !== 'done';

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-10">
      <h1 className="font-display font-extrabold text-xl mb-5">New post</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-muted block mb-1.5">Video file</label>
          <input
            type="file"
            accept="video/*"
            disabled={busy}
            onChange={handleFile}
            className="w-full text-sm text-cream file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-surface-2 file:text-cream file:text-xs file:font-semibold"
          />
          <p className="text-[11px] text-muted mt-1.5">
            Best results: vertical (9:16) video, up to {MAX_MB} MB. Wide videos show without cropping.
          </p>
        </div>

        {previewUrl && (
          <div className="mx-auto w-44 aspect-[9/16] rounded-xl overflow-hidden bg-black border border-white/10">
            <video src={previewUrl} muted playsInline controls className="w-full h-full object-contain" />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-muted">Caption</label>
            <EmojiPicker onPick={(e) => setCaption((c) => c + e)} />
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={busy}
            className="input min-h-[80px]"
            placeholder="Say something about this post..."
          />
        </div>

        {stage === 'uploading' && (
          <div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[11px] text-muted mt-1 text-center">{progress}%</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !file}
          className="bg-amber text-ink font-display font-extrabold rounded-xl py-3 text-[14.5px] disabled:opacity-60"
        >
          {STAGES[stage] || 'Post'}
        </button>

        {error && <p className="text-center text-xs text-coral">{error}</p>}
        {stage === 'done' && (
          <p className="text-center text-xs text-teal">
            Posted!{' '}
            <Link href="/" className="underline">
              Go to the feed
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}

function captureThumbnail(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    let finished = false;
    const finish = (blob, duration) => {
      if (finished) return;
      finished = true;
      URL.revokeObjectURL(url);
      resolve({ blob, duration });
    };
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(0.5, (Number.isFinite(v.duration) ? v.duration : 1) / 2);
    };
    v.onseeked = () => {
      try {
        const scale = Math.min(1, 480 / (v.videoWidth || 480));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round((v.videoWidth || 480) * scale);
        canvas.height = Math.round((v.videoHeight || 854) * scale);
        canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
        const duration = Number.isFinite(v.duration) ? Math.round(v.duration) : null;
        canvas.toBlob((b) => finish(b, duration), 'image/jpeg', 0.8);
      } catch {
        finish(null, null);
      }
    };
    v.onerror = () => finish(null, null);
    setTimeout(() => finish(null, null), 8000);
  });
}

function uploadWithProgress(url, file, accessToken, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed — check your connection.')));
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.send(file);
  });
}
