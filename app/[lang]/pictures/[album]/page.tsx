import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PhotoGallery } from "@/components/pictures/photo-gallery";
import { getContent, photoCount } from "@/lib/content";
import { isLocale, localizedPath } from "@/lib/locale";
import { getAlbum, localized, photoUrl } from "@/lib/pictures/manifest";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pictures/[album]">): Promise<Metadata> {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) notFound();
  const album = await getAlbum(slug);
  if (!album) notFound();
  const path = `/pictures/${slug}`;
  const title = `${localized(album.title, lang)} — Camila Pozas`;
  const url = localizedPath(path, lang);
  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath(path, "en"),
        es: localizedPath(path, "es"),
        "x-default": path,
      },
    },
    openGraph: {
      title,
      url,
      type: "website",
      images: [photoUrl(album.coverId, "2048")],
    },
  };
}

export default async function AlbumPage({
  params,
}: PageProps<"/[lang]/pictures/[album]">) {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) notFound();
  const album = await getAlbum(slug);
  if (!album) notFound();
  const content = getContent(lang);
  const { ui } = content;
  const title = localized(album.title, lang);

  return (
    <>
      <a
        href={localizedPath("/pictures", lang)}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {ui.allAlbums}
      </a>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        {photoCount(content, album.photos.length)}
      </p>
      <PhotoGallery
        photos={album.photos}
        albumTitle={title}
        lang={lang}
        labels={{
          close: ui.close,
          previous: ui.previousPhoto,
          next: ui.nextPhoto,
          openFullSize: ui.openFullSize,
        }}
      />
    </>
  );
}
