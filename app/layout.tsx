import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ToastProvider from '@/components/ToastProvider';
import ClerkThemeProvider from '@/components/ClerkThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SmartJuanPeso AI - Neural Finance',
  description: 'AI-powered financial logic and expense tracking for every Juan.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartJuanPeso AI',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-512x512.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#6366f1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider telemetry={false}>
      <html lang="en" suppressHydrationWarning className="scroll-smooth">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('theme');
                    var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (theme === 'dark' || (!theme && supportDark)) {
                      document.documentElement.classList.add('dark');
                    }
                  } catch (e) {}
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-500`}
        >
          <ThemeProvider>
            <ClerkThemeProvider>
              <Navbar />
              <ToastProvider>
                <main className="flex-1 flex flex-col">
                  {children}
                </main>
              </ToastProvider>
              <Footer />
            </ClerkThemeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}