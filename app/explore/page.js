'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import Icon from '../../components/Icons';
import VideoThumb from '../../components/VideoThumb';

export default function ExplorePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);
  const searchId = useRef(0);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('videos')
        .select('id, caption, category, thumbnail_url, video_url, views_count, pinned, profiles(handle)')
        .order('created_at', { ascending: false });
      if (error) console.error(error);
      setVideos(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Debounced search across videos (caption/category) and people (handle/name).
  useEffect(() => {
    // Strip characters that have special meaning in the search filter syntax.
    const clean = q.trim().replace(/[%,()*\\]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const myId = ++searchId.current;

    const timer = setTimeout(async () => {
      const term = `*${clean}*`;
      const [people, vids] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, handle, display_name, country')
          .or(`handle.ilike.${term},display_name.ilike.${term}`)
          .limit(10),
        supabase
          .from('videos')
          .select('id, caption, category, thumbnail_url, video_url, views_count, pinned, profiles(handle)')
          .or(`caption.ilike.${term},category.ilike.${term}`)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      if (myId !== searchId.current) return; // a newer search replaced this one
      setResults({ people: people.data || [], videos: vids.data || [] });
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [q]);

  const categories = ['All', ...Array.from(new Set(videos.map((v) => v.category).filter(Boolean)))];
  const shown = category === 'All' ? videos : videos.filter((v) => v.category === category);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-8">
      <div className="relative mb-4">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search videos and creators"
          className="input !pl-10 !rounded-full !py-3"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </div>

      {results !== null || searching ? (
        searching && !results ? (
          <p className="text-muted text-sm">Searching…</p>
        ) : (
          <div>
            {results.people.length > 0 && (
              <div className="mb-6">
                <h2 className="font-display font-bold text-sm text-muted mb-2">Creators</h2>
                <div className="flex flex-col">
                  {results.people.map((p) => (
                    <Link
                      key={p.id}
                      href={`/u/${p.handle}`}
                      className="flex items-center gap-3 py-2.5 border-b border-white/5"
                    >
                      <span className="w-11 h-11 rounded-full bg-gradient-to-br from-teal to-amber text-ink font-display font-extrabold flex items-center justify-center">
                        {p.display_name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <span>
                        <span className="block font-bold text-[14px]">{p.display_name}</span>
                        <span className="block text-muted text-[12.5px]">
                          @{p.handle}
                          {p.country ? ` · ${p.country}` : ''}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.videos.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-sm text-muted mb-2">Videos</h2>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-[3px]">
                  {results.videos.map((v) => (
                    <VideoThumb key={v.id} video={v} contextIds={results.videos.map((x) => x.id)} showHandle />
                  ))}
                </div>
              </div>
            )}

            {results.people.length === 0 && results.videos.length === 0 && (
              <p className="text-muted text-sm">Nothing found for “{q.trim()}”. Try a different word.</p>
            )}
          </div>
        )
      ) : loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[12.5px] font-semibold border ${
                  category === c
                    ? 'bg-amber text-ink border-amber'
                    : 'bg-surface-2 text-cream border-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="text-muted text-sm">No videos yet — check back once creators start posting.</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-[3px]">
              {shown.map((v) => (
                <VideoThumb key={v.id} video={v} contextIds={shown.map((x) => x.id)} showHandle />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
