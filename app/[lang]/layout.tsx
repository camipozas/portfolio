import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { getContent } from '@/lib/content';
import { SITE_URL } from '@/lib/data';
import { siteIcons } from '@/lib/icons';
import { isLocale, locales, localizedPath } from '@/lib/locale';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const { siteTitle, siteDescription } = getContent(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: siteTitle,
    description: siteDescription,
    alternates: {
      canonical: localizedPath('/', lang),
      languages: {
        en: localizedPath('/', 'en'),
        es: localizedPath('/', 'es'),
        'x-default': '/',
      },
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: localizedPath('/', lang),
      locale: lang === 'es' ? 'es_CL' : 'en_US',
      alternateLocale: lang === 'es' ? 'en_US' : 'es_CL',
      type: 'website',
    },
    icons: siteIcons,
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
