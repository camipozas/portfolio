import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { NotFoundMessage } from '@/components/not-found-message';
import { siteIcons } from '@/lib/icons';
import './globals.css';

// The root layout lives under app/[lang], so unmatched URLs (/fr, /es/nope) render this page on its own.
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '404 — Camila Pozas',
  icons: siteIcons,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NotFoundMessage />
        </ThemeProvider>
      </body>
    </html>
  );
}
