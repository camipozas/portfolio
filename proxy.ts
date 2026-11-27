import { type NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  localizedPath,
} from "@/lib/locale";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  // The language toggle links to "?lang=xx": remember the choice, like next-themes does for the theme.
  const requested = url.searchParams.get("lang") ?? undefined;
  if (isLocale(requested)) {
    url.searchParams.delete("lang");
    url.pathname = localizedPath(url.pathname, requested);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, requested, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
    return response;
  }

  const segment = url.pathname.split("/")[1];
  if (isLocale(segment) && segment !== defaultLocale) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(cookie) ? cookie : defaultLocale;
  if (segment === defaultLocale || preferred !== defaultLocale) {
    url.pathname = localizedPath(url.pathname, preferred);
    return NextResponse.redirect(url);
  }

  // English is served from "/" without a prefix.
  url.pathname =
    url.pathname === "/"
      ? `/${defaultLocale}`
      : `/${defaultLocale}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes and files such as robots.txt or sitemap.xml.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
