export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "lang";

// Shown in the target language, so it is never translated.
export const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value);
}

// English has no prefix ("/"), Spanish lives under "/es".
export function localizedPath(pathname: string, lang: Locale): string {
  const bare = pathname.replace(/^\/(en|es)(?=\/|$)/, "") || "/";
  if (lang === defaultLocale) {
    return bare;
  }
  return bare === "/" ? `/${lang}` : `/${lang}${bare}`;
}
