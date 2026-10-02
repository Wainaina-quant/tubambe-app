'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useSound } from '../lib/SoundContext';
import { formatCount, registerView } from '../lib/videos';
import Icon from './Icons';
import CommentsSheet from './CommentsSheet';
import ReportModal from './ReportModal';

function Action({ icon, label, onClick, on = false, onClass = 'text-coral', color = 'text-cream', fillWhenOn = false }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span
        className={`w-11 h-11 rounded-full flex items-center justify-center bg-black/30 md:bg-white/10 backdrop-blur-sm transition-transform active:scale-90 ${
          on ? onClass : color
        }`}
      >
        <Icon name={icon} size={22} fill={on && fillWhenOn ? 'currentColor' : 'none'} />
      </span>
      <span className="text-[11px] font-bold drop-shadow">{label}</span>
    </button>
  );
}

/**
 * One TikTok-style post.
 * - active: this is the video currently on screen (only this one plays)
 * - nearby: this video is close enough to the active one to be worth loading
 * - onVisible(index): tells the feed when this card scrolls into view
 * - onPinned(videoId): tells the feed a different video is now this creator's pin,
 *   so it can update ordering/badges elsewhere without a full refetch
 */
export default function VideoCard({ video, currentUserId, active = true, nearby = true, index = 0, onVisible, onPinned }) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const { soundOn, setSoundOn, activated } = useSound();
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;
  const viewedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [fit, setFit] = useState('cover');
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(!!video._liked);
  const [likeCount, setLikeCount] = useState(video.likes?.[0]?.count || 0);
  const [reposted, setReposted] = useState(!!video._reposted);
  const [repostCount, setRepostCount] = useState(video.reposts?.[0]?.count || 0);
  const [saved, setSaved] = useState(!!video._saved);
  const [commentCount, setCommentCount] = useState(video.comments?.[0]?.count || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinned, setPinned] = useState(!!video.pinned);
  const [reportOpen, setReportOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handle = video.profiles?.handle || 'creator';
  const isOwner = currentUserId && currentUserId === video.creator_id;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !onVisible) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) onVisible(index);
      },
      { threshold: [0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, onVisible]);

  // Play only while active; pause (and rewind) as soon as it's scrolled away.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && nearby) {
      v.muted = !soundOnRef.current;
      const p = v.play();
      if (p && p.catch) {
        p.catch(() => {
          v.muted = true;
          v.play().catch(() => {});
        });
      }
      if (!viewedRef.current) {
        viewedRef.current = true;
        registerView(video.id);
      }
    } else {
      v.pause();
      if (!active) {
        try {
          v.currentTime = 0;
        } catch {}
      }
    }
  }, [active, nearby, video.id]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function toggleSound() {
    const v = videoRef.current;
    const next = !soundOn;
    setSoundOn(next); // remembered app-wide, for every video going forward
    if (v) v.muted = !next; // flipped immediately, inside this click — a real
    // user gesture, so the browser always allows it, unlike a delayed effect
  }

  function needSignIn() {
    router.push('/login');
  }

  async function handleLike() {
    if (!currentUserId) return needSignIn();
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, next ? c + 1 : c - 1));
    if (next) await supabase.from('likes').insert({ video_id: video.id, user_id: currentUserId });
    else await supabase.from('likes').delete().match({ video_id: video.id, user_id: currentUserId });
  }

  async function handleRepost() {
    if (!currentUserId) return needSignIn();
    const next = !reposted;
    setReposted(next);
    setRepostCount((c) => Math.max(0, next ? c + 1 : c - 1));
    if (next) await supabase.from('reposts').insert({ video_id: video.id, user_id: currentUserId });
    else await supabase.from('reposts').delete().match({ video_id: video.id, user_id: currentUserId });
  }

  async function handleSave() {
    if (!currentUserId) return needSignIn();
    const next = !saved;
    setSaved(next);
    if (next) await supabase.from('saves').insert({ video_id: video.id, user_id: currentUserId });
    else await supabase.from('saves').delete().match({ video_id: video.id, user_id: currentUserId });
  }

  async function handleShare() {
    const url = `${window.location.origin}/video/${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link:', url);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm('Delete this video? This can\'t be undone.')) return;
    const { error } = await supabase.from('videos').delete().eq('id', video.id);
    if (error) alert(error.message);
    else setRemoved(true);
  }

  async function handleBlock() {
    setMenuOpen(false);
    if (!currentUserId) return needSignIn();
    if (!window.confirm(`Block @${handle}? You won't see each other's videos anymore.`)) return;
    const { error } = await supabase.from('blocks').insert({ blocker_id: currentUserId, blocked_id: video.creator_id });
    if (error) alert(error.message);
    else setRemoved(true);
  }

  async function togglePin() {
    setMenuOpen(false);
    const next = !pinned;
    setPinned(next);
    if (next) {
      // Only one pinned video per creator — unpin any previous one first.
      await supabase.from('videos').update({ pinned: false }).eq('creator_id', currentUserId).eq('pinned', true);
    }
    await supabase.from('videos').update({ pinned: next }).eq('id', video.id);
    onPinned?.(video.id, next);
  }

  const rail = (
    <>
      <Link
        href={`/u/${handle}`}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-teal to-amber text-ink font-display font-extrabold flex items-center justify-center border-2 border-cream/80"
        aria-label={`Open @${handle}'s profile`}
      >
        {handle[0]?.toUpperCase()}
      </Link>
      <Action icon="heart" label={formatCount(likeCount)} on={liked} onClick={handleLike} fillWhenOn />
      <Action icon="message" label={formatCount(commentCount)} onClick={() => setCommentsOpen(true)} />
      <Action icon="repeat" label={formatCount(repostCount)} on={reposted} onClass="text-teal" onClick={handleRepost} />
      <Action icon="bookmark" label={saved ? 'Saved' : 'Save'} on={saved} onClass="text-amber" fillWhenOn onClick={handleSave} />
      <Action icon="share" label={copied ? 'Copied' : 'Share'} onClick={handleShare} />
    </>
  );

  if (removed) {
    return (
      <section ref={sectionRef} className="h-full w-full snap-start snap-always flex items-center justify-center text-muted text-sm">
        Removed.
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-full w-full snap-start snap-always flex items-center justify-center gap-4 md:py-3"
    >
      <div className="relative h-full w-full md:w-auto md:aspect-[9/16] md:max-w-full md:rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={nearby ? video.video_url : undefined}
          poster={video.thumbnail_url || undefined}
          className={`absolute inset-0 w-full h-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
          loop
          playsInline
          preload={active ? 'auto' : 'metadata'}
          onClick={togglePlay}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.videoWidth && v.videoHeight) {
              setFit(v.videoWidth / v.videoHeight <= 0.65 ? 'cover' : 'contain');
            }
          }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (barRef.current && v.duration) barRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
          }}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

        {active && paused && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center text-cream">
              <Icon name="play" size={28} fill="currentColor" strokeWidth={0} />
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Video options"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-cream"
            >
              <Icon name="more-horizontal" size={18} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 bg-surface-2 border border-white/10 rounded-xl overflow-hidden z-20 w-48 shadow-xl">
                  {isOwner ? (
                    <>
                      <button
                        onClick={togglePin}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold hover:bg-white/5"
                      >
                        <Icon name="pin" size={16} /> {pinned ? 'Unpin from profile' : 'Pin to profile'}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-coral hover:bg-white/5"
                      >
                        <Icon name="x" size={16} /> Delete video
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          currentUserId ? setReportOpen(true) : needSignIn();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold hover:bg-white/5"
                      >
                        <Icon name="eye" size={16} /> Report video
                      </button>
                      <button
                        onClick={handleBlock}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-coral hover:bg-white/5"
                      >
                        <Icon name="x" size={16} /> Block @{handle}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            onClick={toggleSound}
            aria-label={soundOn && activated ? 'Mute' : 'Turn sound on'}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-cream"
          >
            <Icon name={soundOn && activated ? 'volume' : 'volume-off'} size={18} />
          </button>
        </div>

        {pinned && (
          <span className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm text-cream text-[10.5px] font-bold rounded-full px-2.5 py-1 flex items-center gap-1">
            <Icon name="pin" size={11} fill="currentColor" /> Pinned
          </span>
        )}

        <div className="absolute left-0 right-0 bottom-0 p-4 pb-5 pr-16 md:pr-4 pointer-events-none">
          <Link href={`/u/${handle}`} className="pointer-events-auto font-display font-bold text-[15px] hover:underline">
            @{handle}
          </Link>
          {video.caption && (
            <p
              onClick={() => setExpanded((e) => !e)}
              className={`pointer-events-auto text-[13.5px] leading-snug text-cream/95 mt-1 cursor-pointer ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {video.caption}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              <Icon name="eye" size={12} /> {formatCount(video.views_count)}
            </span>
          </div>
        </div>

        <div className="md:hidden absolute right-2 bottom-6 z-10 flex flex-col items-center gap-3.5">{rail}</div>

        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 pointer-events-none">
          <div ref={barRef} className="h-full bg-cream" style={{ width: '0%' }} />
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center gap-4 self-end pb-4">{rail}</div>

      {commentsOpen && (
        <CommentsSheet
          videoId={video.id}
          currentUserId={currentUserId}
          onClose={() => setCommentsOpen(false)}
          onPosted={() => setCommentCount((c) => c + 1)}
          onDeleted={() => setCommentCount((c) => Math.max(0, c - 1))}
        />
      )}

      {reportOpen && (
        <ReportModal targetType="video" targetId={video.id} reporterId={currentUserId} onClose={() => setReportOpen(false)} />
      )}
    </section>
  );
}
