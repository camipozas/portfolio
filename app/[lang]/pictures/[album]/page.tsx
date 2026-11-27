import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { PhotoGallery } from "@/components/pictures/photo-gallery";
import { getContent } from "@/lib/content";
import { isLocale, localizedPath } from "@/lib/locale";
import { getAlbum, localized, photoUrl } from "@/lib/pictures/manifest";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pictures/[album]">): Promise<Metadata> {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) notFound();
  const album = await getAlbum(slug);
  if (!album) notFound();
  const path = `/pictures/${slug}`;
  return {
    title: `${localized(album.title, lang)} — Camila Pozas`,
    alternates: {
      canonical: localizedPath(path, lang),
      languages: {
        en: localizedPath(path, "en"),
        es: localizedPath(path, "es"),
        "x-default": path,
      },
    },
    openGraph: { images: [photoUrl(album.coverId, "2048")] },
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
  const count = album.photos.length;

  return (
    <>
      <Nav
        lang={lang}
        navLinks={content.menuLinks}
        toggleThemeLabel={ui.toggleTheme}
      />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        <a
          href={localizedPath("/pictures", lang)}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {ui.allAlbums}
        </a>
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-1 mb-8 text-sm text-muted">
          {count} {count === 1 ? ui.photo : ui.photos}
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
      </main>
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <Footer content={content} />
      </div>
    </>
  );
}
