import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContent, photoCount } from "@/lib/content";
import { isLocale, localizedPath } from "@/lib/locale";
import { getAlbums, localized, photoUrl } from "@/lib/pictures/manifest";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pictures">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = getContent(lang);
  const title = `${content.picturesLabel} — Camila Pozas`;
  const url = localizedPath("/pictures", lang);
  return {
    title,
    description: content.ui.picturesIntro,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath("/pictures", "en"),
        es: localizedPath("/pictures", "es"),
        "x-default": "/pictures",
      },
    },
    openGraph: { title, url, type: "website" },
  };
}

export default async function PicturesPage({
  params,
}: PageProps<"/[lang]/pictures">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = getContent(lang);
  // A CDN outage must not block deploys; ISR refills the page on the next revalidate.
  const albums = await getAlbums().catch(() => []);

  return (
    <>
      <h1 className="text-2xl font-semibold">{content.picturesLabel}</h1>
      <p className="mt-2 text-muted">{content.ui.picturesIntro}</p>
      {albums.length === 0 ? (
        <p className="mt-10 text-muted">{content.ui.picturesEmpty}</p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <li key={album.slug}>
              <a
                href={localizedPath(`/pictures/${album.slug}`, lang)}
                className="group block"
              >
                {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
                <img
                  src={photoUrl(album.coverId, "thumb")}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-md object-cover transition-opacity group-hover:opacity-90"
                />
                <h2 className="mt-2 font-medium group-hover:text-accent">
                  {localized(album.title, lang)}
                </h2>
                <p className="text-sm text-muted">
                  {photoCount(content, album.photos.length)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
