'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { useNotifications } from '../lib/NotificationsContext';
import { supabase } from '../lib/supabaseClient';
import Icon from './Icons';
import Logo from './Logo';

const NAV = [
  { href: '/', label: 'For You', icon: 'home' },
  { href: '/explore', label: 'Explore', icon: 'compass' },
  { href: '/upload', label: 'Upload', icon: 'plus-square' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function BellLink({ size = 20, className = '' }) {
  const { unreadCount } = useNotifications();
  return (
    <Link href="/notifications" aria-label="Notifications" className={`relative ${className}`}>
      <Icon name="bell" size={size} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-[3px] rounded-full bg-coral text-[9px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

function Sidebar({ pathname, user, loading }) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/10 bg-ink px-3 py-5">
      <div className="flex items-center justify-between px-2 mb-6">
        <Link href="/">
          <Logo size={26} />
        </Link>
        {user && <BellLink className="text-cream" />}
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold transition-colors hover:bg-white/5 ${
                active ? 'text-amber' : 'text-cream'
              }`}
            >
              <Icon name={item.icon} size={24} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-1">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 px-2 mb-3 text-[10.5px] text-muted">
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/guidelines" className="hover:underline">Guidelines</Link>
        </div>
        {loading ? null : user ? (
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[14px] font-semibold text-muted hover:bg-white/5"
          >
            <Icon name="log-out" size={20} /> Sign out
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <Link href="/login" className="text-center bg-amber text-ink font-display font-extrabold rounded-xl py-2.5 text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="text-center text-teal font-semibold text-[13px]">
              Create an account
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

function MobileTopBar({ user, loading }) {
  return (
    <header className="md:hidden shrink-0 h-11 flex items-center justify-between px-4 bg-ink border-b border-white/5 pt-[env(safe-area-inset-top)] box-content">
      <Link href="/">
        <Logo size={22} />
      </Link>
      <div className="flex items-center gap-4">
        {user && <BellLink size={19} className="text-cream" />}
        {loading ? null : user ? (
          <button onClick={() => supabase.auth.signOut()} className="text-[12px] text-muted font-semibold">
            Sign out
          </button>
        ) : (
          <Link href="/login" className="text-[12px] text-teal font-semibold">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function BottomNav({ pathname }) {
  return (
    <nav className="md:hidden shrink-0 bg-ink border-t border-white/10 flex items-center justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        if (item.href === '/upload') {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label="Upload"
              className="w-12 h-8 rounded-lg bg-amber text-ink flex items-center justify-center"
            >
              <Icon name="plus" size={22} strokeWidth={2.6} />
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-[10.5px] font-semibold px-3 ${
              active ? 'text-cream' : 'text-muted'
            }`}
          >
            <Icon name={item.icon} size={22} className={active ? 'text-amber' : ''} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  return (
    <div className="h-dvh flex flex-col md:flex-row">
      <Sidebar pathname={pathname} user={user} loading={loading} />
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <MobileTopBar user={user} loading={loading} />
        <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
        <BottomNav pathname={pathname} />
      </div>
    </div>
  );
}
