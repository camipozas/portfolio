import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const CLOUDFRONT = "https://d3j0xmrk71qrvn.cloudfront.net/public";

export const metadata: Metadata = {
  title: "Camila Pozas — Software Engineer",
  description:
    "Software Engineer with experience in backend development, TypeScript, Docker, and Cloud.",
  openGraph: {
    title: "Camila Pozas — Software Engineer",
    description:
      "Software Engineer with experience in backend development, TypeScript, Docker, and Cloud.",
    url: "https://camipozas.dev",
    type: "website",
  },
  icons: {
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
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto max-w-2xl px-6 py-16">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
