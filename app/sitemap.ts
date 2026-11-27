import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";
import { localizedPath } from "@/lib/locale";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    en: `${SITE_URL}${localizedPath("/", "en")}`,
    es: `${SITE_URL}${localizedPath("/", "es")}`,
  };
  return Object.values(languages).map((url) => ({
    url,
    lastModified: new Date(),
    alternates: { languages },
  }));
}
