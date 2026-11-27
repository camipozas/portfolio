import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";
import { localizedPath } from "@/lib/locale";
import { getAlbums } from "@/lib/pictures/manifest";

function entry(path: string): MetadataRoute.Sitemap[number][] {
  const languages = {
    en: `${SITE_URL}${localizedPath(path, "en")}`,
    es: `${SITE_URL}${localizedPath(path, "es")}`,
  };
  return Object.values(languages).map((url) => ({
    url,
    lastModified: new Date(),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums = await getAlbums();
  return [
    "/",
    "/pictures",
    ...albums.map((album) => `/pictures/${album.slug}`),
  ].flatMap(entry);
}
