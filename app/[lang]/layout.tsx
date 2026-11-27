import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { getContent } from "@/lib/content";
import { SITE_URL } from "@/lib/data";
import { isLocale, locales, localizedPath } from "@/lib/locale";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

const CLOUDFRONT = "https://d3j0xmrk71qrvn.cloudfront.net/public";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
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
      canonical: localizedPath("/", lang),
      languages: {
        en: localizedPath("/", "en"),
        es: localizedPath("/", "es"),
        "x-default": "/",
      },
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: localizedPath("/", lang),
      locale: lang === "es" ? "es_CL" : "en_US",
      alternateLocale: lang === "es" ? "en_US" : "es_CL",
      type: "website",
    },
    icons,
  };
}

const icons: Metadata["icons"] = {
  icon: [
    { url: `${CLOUDFRONT}/favicon.ico`, sizes: "any" },
    {
      url: `${CLOUDFRONT}/favicon-16x16.png`,
      sizes: "16x16",
      type: "image/png",
    },
    {
      url: `${CLOUDFRONT}/favicon-32x32.png`,
      sizes: "32x32",
      type: "image/png",
    },
  ],
  apple: {
    url: `${CLOUDFRONT}/android-chrome-192x192.png`,
    sizes: "192x192",
  },
  other: [
    {
      rel: "icon",
      url: `${CLOUDFRONT}/android-chrome-384x384.png`,
      sizes: "384x384",
    },
    {
      rel: "icon",
      url: `${CLOUDFRONT}/android-chrome-512x512.png`,
      sizes: "512x512",
    },
    {
      rel: "msapplication-TileImage",
      url: `${CLOUDFRONT}/mstile-150x150.png`,
    },
  ],
};

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
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
