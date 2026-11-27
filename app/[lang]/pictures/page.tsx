import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { getContent } from "@/lib/content";
import { isLocale, localizedPath } from "@/lib/locale";
import { getAlbums, localized, photoUrl } from "@/lib/pictures/manifest";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/pictures">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = getContent(lang);
  return {
    title: `${content.picturesLabel} — Camila Pozas`,
    description: content.ui.picturesIntro,
    alternates: {
      canonical: localizedPath("/pictures", lang),
      languages: {
        en: localizedPath("/pictures", "en"),
        es: localizedPath("/pictures", "es"),
        "x-default": "/pictures",
      },
    },
  };
}

export default async function PicturesPage({
  params,
}: PageProps<"/[lang]/pictures">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = getContent(lang);
  const { ui } = content;
  const albums = await getAlbums();

  return (
    <>
      <Nav
        lang={lang}
        navLinks={content.menuLinks}
        toggleThemeLabel={ui.toggleTheme}
      />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        <h1 className="text-2xl font-semibold">{content.picturesLabel}</h1>
        <p className="mt-2 text-muted">{ui.picturesIntro}</p>
        {albums.length === 0 ? (
          <p className="mt-10 text-muted">{ui.picturesEmpty}</p>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const title = localized(album.title, lang);
              const count = album.photos.length;
              return (
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
                      {title}
                    </h2>
                    <p className="text-sm text-muted">
                      {count} {count === 1 ? ui.photo : ui.photos}
                    </p>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <Footer content={content} />
      </div>
    </>
  );
}
