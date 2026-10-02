import './globals.css';
import AppShell from '../components/AppShell';
import SplashScreen from '../components/SplashScreen';
import { AuthProvider } from '../lib/AuthContext';
import { SoundProvider } from '../lib/SoundContext';
import { NotificationsProvider } from '../lib/NotificationsContext';

export const metadata = {
  title: 'Tubambe',
  description: 'A video platform built for African creators and the brands who want to reach them.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tubambe',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#140F2B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0714] text-cream overflow-hidden">
        <SplashScreen />
        <AuthProvider>
          <NotificationsProvider>
            <SoundProvider>
              <AppShell>{children}</AppShell>
            </SoundProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
