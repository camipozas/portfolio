import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fotos · Administración',
  robots: { index: false, follow: false },
};

// Only the backoffice Vercel project sets BACKOFFICE=1; the public site answers 404.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.BACKOFFICE !== '1') {
    notFound();
  }
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
