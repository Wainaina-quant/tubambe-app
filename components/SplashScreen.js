'use client';

import { useEffect, useState } from 'react';
import Logo from './Logo';

// Shows the logo briefly on app open, then fades out — like TikTok/Instagram.
// Lives in the root layout, so it only appears once per app open (a full
// page load), not when navigating between screens inside the app.
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 700);
    const remove = setTimeout(() => setVisible(false), 1000);
    return () => {
      clearTimeout(fade);
      clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-ink flex items-center justify-center transition-opacity duration-300 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <Logo size={64} wordmark={false} />
    </div>
  );
}
