import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// The root layout lives under app/[lang], so unmatched URLs (/fr, /es/nope) render this page on its own.
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 — Camila Pozas",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
            <h1 className="text-lg font-medium">404 — Page not found</h1>
            <p className="text-sm text-muted">
              <a href="/" className="accent-link">
                camipg.com
              </a>{" "}
              ·{" "}
              <a href="/es" className="accent-link" lang="es">
                Página no encontrada — ir al inicio
              </a>
            </p>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
