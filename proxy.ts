import { type NextRequest, NextResponse } from "next/server";
import {
  isValidSession,
  SESSION_COOKIE,
  sessionSecret,
} from "@/lib/backoffice/auth";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  localizedPath,
} from "@/lib/locale";

const ONE_YEAR = 60 * 60 * 24 * 365;

function adminGate(request: NextRequest) {
  // The public site renders /admin as 404 (see app/admin/layout.tsx).
  if (
    process.env.BACKOFFICE !== "1" ||
    request.nextUrl.pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return isValidSession(token, sessionSecret())
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/admin/login", request.url));
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return adminGate(request);
  }
  if (process.env.BACKOFFICE === "1") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

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
