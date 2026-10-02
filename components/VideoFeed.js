'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import VideoCard from './VideoCard';
import Icon from './Icons';

/**
 * A vertical, snap-scrolling, one-video-plays-at-a-time feed. Shared by the
 * For You page and the single-video page, so both scroll and play back
 * exactly the same way.
 */
export default function VideoFeed({ videos, currentUserId, initialIndex = 0, onBack }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const containerRef = useRef(null);
  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;
  const didInitialScroll = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || didInitialScroll.current || initialIndex === 0) return;
    didInitialScroll.current = true;
    el.scrollTop = initialIndex * el.clientHeight;
  }, [initialIndex]);

  const handleVisible = useCallback((i) => setActiveIndex(i), []);

  const goTo = useCallback(
    (i) => {
      const el = containerRef.current;
      if (!el) return;
      const target = Math.max(0, Math.min(videos.length - 1, i));
      el.scrollTo({ top: target * el.clientHeight, behavior: 'smooth' });
    },
    [videos.length]
  );

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goTo(activeRef.current + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(activeRef.current - 1);
      } else if (e.key === 'Escape' && onBack) {
        onBack();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, onBack]);

  if (videos.length === 0) return null;

  return (
    <div className="relative h-full">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-cream md:top-4 md:left-4"
        >
          <Icon name="arrow-left" size={19} />
        </button>
      )}

      <div ref={containerRef} className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar">
        {videos.map((video, i) => (
          <VideoCard
            key={`${video.id}-${currentUserId || 'anon'}`}
            video={video}
            currentUserId={currentUserId}
            index={i}
            active={i === activeIndex}
            nearby={Math.abs(i - activeIndex) <= 1}
            onVisible={handleVisible}
          />
        ))}
      </div>

      <div className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 flex-col gap-3 z-20">
        <button
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous video"
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30"
        >
          <Icon name="chevron-up" size={22} />
        </button>
        <button
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex >= videos.length - 1}
          aria-label="Next video"
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center disabled:opacity-30"
        >
          <Icon name="chevron-down" size={22} />
        </button>
      </div>
    </div>
  );
}
