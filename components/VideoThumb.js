'use client';

import Link from 'next/link';
import Icon from './Icons';
import { formatCount } from '../lib/videos';
import { rememberVideoList } from '../lib/videoContext';

/**
 * Grid thumbnail. `contextIds` is the ordered list of every video id in the
 * grid this thumbnail belongs to — clicking remembers that list so the
 * video page can scroll through the same set instead of showing just one.
 */
export default function VideoThumb({ video, contextIds, showHandle = false }) {
  return (
    <Link
      href={`/video/${video.id}`}
      onClick={() => contextIds && rememberVideoList(contextIds)}
      className="relative block aspect-[9/13] bg-surface-2 overflow-hidden group"
    >
      {video.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnail_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : video.video_url ? (
        <video
          src={`${video.video_url}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {video.pinned && (
        <span className="absolute top-1.5 left-1.5 bg-black/50 rounded-full p-1">
          <Icon name="pin" size={10} fill="currentColor" className="text-amber" />
        </span>
      )}

      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 text-[10.5px] font-semibold text-cream">
        <Icon name="play" size={11} fill="currentColor" strokeWidth={0} />
        <span className="truncate">{formatCount(video.views_count)}</span>
        {showHandle && video.profiles?.handle && <span className="truncate">· @{video.profiles.handle}</span>}
      </div>
    </Link>
  );
}
