import { Languages } from "lucide-react";
import { name } from "@/lib/data";
import { type Locale, languageNames, localizedPath } from "@/lib/locale";
import type { NavLink } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface NavProps {
  lang: Locale;
  navLinks: NavLink[];
  toggleThemeLabel: string;
}

export function Nav({ lang, navLinks, toggleThemeLabel }: NavProps) {
  const other: Locale = lang === "en" ? "es" : "en";
  const home = localizedPath("/", lang);
  // Section anchors live on the home page, so they also work from /pictures.
  const hrefOf = (href: string) =>
    href.startsWith("#") ? `${home}${href}` : localizedPath(href, lang);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <a
          href={localizedPath("/", lang)}
          className="shrink-0 whitespace-nowrap text-sm font-medium"
        >
          {name}
        </a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 whitespace-nowrap">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={hrefOf(link.href)}
                // Section anchors only fit on wide screens; whole pages stay reachable on phones.
                className={cn(
                  "text-sm text-muted transition-colors hover:text-accent",
                  link.href.startsWith("#") && "hidden md:inline",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>
          {/* The proxy turns "?lang=" into a cookie, so the choice survives reloads like the theme does. */}
          <a
            href={`?lang=${other}`}
            hrefLang={other}
            lang={other}
            aria-label={languageNames[other]}
            title={languageNames[other]}
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-accent"
          >
            <Languages size={16} aria-hidden="true" />
            {other.toUpperCase()}
          </a>
          <ThemeToggle label={toggleThemeLabel} />
        </div>
      </div>
    </nav>
  );
}
