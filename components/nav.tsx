import { Languages } from 'lucide-react';
import { name } from '@/lib/data';
import type { Locale } from '@/lib/locale';
import { languageNames, localizedPath } from '@/lib/locale';
import type { NavLink } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

interface NavProps {
  lang: Locale;
  navLinks: NavLink[];
  toggleThemeLabel: string;
}

export function Nav({ lang, navLinks, toggleThemeLabel }: NavProps) {
  const other: Locale = lang === 'en' ? 'es' : 'en';
  const home = localizedPath('/', lang);
  // Section anchors live on the home page, so they also work from /pictures.
  const hrefOf = (href: string) =>
    href.startsWith('#') ? `${home}${href}` : localizedPath(href, lang);

  return (
    <nav className="border-border bg-background/80 fixed top-0 right-0 left-0 z-50 border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <a
          className="shrink-0 text-sm font-medium whitespace-nowrap"
          href={localizedPath('/', lang)}
        >
          {name}
        </a>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 whitespace-nowrap">
            {navLinks.map((link) => (
              <a
                // Section anchors only fit on wide screens; whole pages stay reachable on phones.
                className={cn(
                  'text-muted hover:text-accent text-sm transition-colors',
                  link.href.startsWith('#') && 'hidden md:inline'
                )}
                href={hrefOf(link.href)}
                key={link.href}
              >
                {link.label}
              </a>
            ))}
          </div>
          {/* The proxy turns "?lang=" into a cookie, so the choice survives reloads like the theme does. */}
          <a
            aria-label={languageNames[other]}
            className="text-muted hover:text-accent flex items-center gap-1 text-sm transition-colors"
            href={`?lang=${other}`}
            hrefLang={other}
            lang={other}
            title={languageNames[other]}
          >
            <Languages aria-hidden="true" size={16} />
            {other.toUpperCase()}
          </a>
          <ThemeToggle label={toggleThemeLabel} />
        </div>
      </div>
    </nav>
  );
}
