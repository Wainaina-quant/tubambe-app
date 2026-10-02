'use client';

import { useId } from 'react';

// Icon: a rounded squircle carrying a play-shape (video) with a small spark
// (the "spark of a creator being discovered") cut out of it in the brand's
// teal→amber gradient. `wordmark` adds the "Tubambe." name beside it.
export default function Logo({ size = 28, wordmark = true, className = '' }) {
  const gid = useId();
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill={`url(#${gid})`} />
        <path d="M15.5 11.5L28 20l-12.5 8.5v-17z" fill="#140F2B" />
        <circle cx="30.5" cy="9.5" r="2.4" fill="#140F2B" />
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2BC7B8" />
            <stop offset="1" stopColor="#F4A93B" />
          </linearGradient>
        </defs>
      </svg>
      {wordmark && (
        <span className="font-display font-extrabold text-xl leading-none">
          Tubambe<span className="text-amber">.</span>
        </span>
      )}
    </span>
  );
}
