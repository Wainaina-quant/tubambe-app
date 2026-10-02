'use client';

import { useState } from 'react';
import Link from 'next/link';
import VideoThumb from './VideoThumb';
import Icon from './Icons';
import ReportModal from './ReportModal';
import { formatCount } from '../lib/videos';
import { linkifyParts } from '../lib/linkify';

const TABS = [
  { key: 'posts', label: 'Posts', icon: 'compass' },
  { key: 'saved', label: 'Saved', icon: 'bookmark' },
  { key: 'reposted', label: 'Reposts', icon: 'repeat' },
];

export default function ProfileView({
  profile,
  videos,
  saved,
  reposted,
  followers,
  following,
  followStatus,
  canView,
  isOwn,
  viewerId,
  onToggleFollow,
  onBlock,
}) {
  const [tab, setTab] = useState('posts');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const listsByTab = { posts: videos, saved, reposted };
  const activeList = listsByTab[tab] || [];

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-10">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full mb-3 overflow-hidden bg-gradient-to-br from-teal to-amber flex items-center justify-center font-display font-extrabold text-4xl text-ink">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.display_name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <h1 className="font-display font-extrabold text-xl flex items-center gap-1.5">
          {profile.display_name}
          {profile.is_private && <Icon name="lock" size={14} className="text-muted" />}
          {!isOwn && (
            <span className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} aria-label="Profile options" className="text-muted">
                <Icon name="more-horizontal" size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 bg-surface-2 border border-white/10 rounded-xl overflow-hidden z-20 w-44 shadow-xl text-left">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setReportOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold hover:bg-white/5"
                    >
                      <Icon name="eye" size={15} /> Report account
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onBlock?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-coral hover:bg-white/5"
                    >
                      <Icon name="x" size={15} /> Block
                    </button>
                  </div>
                </>
              )}
            </span>
          )}
        </h1>
        <p className="text-muted text-[13px] mb-3">
          @{profile.handle}
          {profile.country ? ` · ${profile.country}` : ''}
        </p>

        {profile.bio && (
          <p className="text-[13.5px] leading-snug max-w-sm mb-3 whitespace-pre-wrap">
            {linkifyParts(profile.bio).map((p) =>
              p.type === 'link' ? (
                <a key={p.key} href={p.text} target="_blank" rel="noopener noreferrer" className="text-teal">
                  {p.text}
                </a>
              ) : (
                <span key={p.key}>{p.text}</span>
              )
            )}
          </p>
        )}

        <div className="flex justify-center gap-8 mb-5">
          <Stat value={videos.length} label="Posts" />
          <Stat value={followers} label="Followers" />
          <Stat value={following} label="Following" />
        </div>

        {isOwn ? (
          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 bg-surface-2 border border-white/10 rounded-full px-5 py-2.5 text-[13px] font-semibold"
          >
            <Icon name="edit" size={14} /> Edit profile
          </Link>
        ) : (
          <button
            onClick={onToggleFollow}
            className={`rounded-full px-8 py-2.5 text-[13.5px] font-display font-extrabold flex items-center gap-1.5 ${
              followStatus ? 'bg-surface-2 text-cream border border-white/15' : 'bg-amber text-ink'
            }`}
          >
            {followStatus === 'pending' && <Icon name="user-check" size={14} />}
            {followStatus === 'pending' ? 'Requested' : followStatus === 'accepted' ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {!canView ? (
        <div className="mt-10 flex flex-col items-center text-center gap-2">
          <Icon name="lock" size={28} className="text-muted" />
          <p className="font-display font-bold">This account is private</p>
          <p className="text-muted text-sm max-w-xs">
            Follow @{profile.handle} to see their videos once they accept your request.
          </p>
        </div>
      ) : (
        <div className="mt-8 border-t border-white/10">
          <div className="flex justify-center gap-1 py-2">
            {TABS.filter((t) => t.key === 'posts' || isOwn).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-bold rounded-full ${
                  tab === t.key ? 'text-amber' : 'text-muted'
                }`}
              >
                <Icon name={t.icon} size={15} fill={t.key === 'saved' && tab === t.key ? 'currentColor' : 'none'} />
                {t.label}
              </button>
            ))}
          </div>

          {activeList.length === 0 ? (
            <p className="text-center text-muted text-sm py-6">
              {tab === 'posts' ? 'No posts yet.' : tab === 'saved' ? 'No saved videos yet.' : 'No reposts yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-[3px]">
              {activeList.map((v) => (
                <VideoThumb key={v.id} video={v} contextIds={activeList.map((x) => x.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {reportOpen && (
        <ReportModal targetType="profile" targetId={profile.id} reporterId={viewerId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-display font-bold text-lg">{formatCount(value)}</p>
      <span className="text-[11.5px] text-muted">{label}</span>
    </div>
  );
}
