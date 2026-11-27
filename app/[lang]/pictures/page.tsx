import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Section } from '@/components/pictures/collection-sections';
import {
  CollectionSections,
  FilteredCollectionSections,
} from '@/components/pictures/collection-sections';
import type { Content } from '@/lib/content';
import { getContent, photoCount } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { isLocale, localizedPath } from '@/lib/locale';
import { formatDateRange } from '@/lib/pictures/exif';
import { getManifest, localized, photoUrl } from '@/lib/pictures/manifest';
import type { Album } from '@/lib/pictures/types';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const content = getContent(lang);
  const title = `${content.picturesLabel} — Camila Pozas`;
  const url = localizedPath('/pictures', lang);
  return {
    title,
    description: content.ui.picturesIntro,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath('/pictures', 'en'),
        es: localizedPath('/pictures', 'es'),
        'x-default': '/pictures',
      },
    },
    openGraph: { title, url, type: 'website' },
  };
}

function AlbumGrid({
  albums,
  content,
  lang,
  heading: Heading = 'h2',
}: {
  albums: Album[];
  content: Content;
  lang: Locale;
  heading?: 'h2' | 'h3';
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <li key={album.slug}>
          <a
            className="group block"
            href={localizedPath(`/pictures/${album.slug}`, lang)}
          >
            <div className="bg-border overflow-hidden rounded-lg">
              {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
              <img
                alt=""
                className="aspect-[4/3] w-full object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                decoding="async"
                loading="lazy"
                src={photoUrl(album.coverId, 'thumb')}
              />
            </div>
            <Heading className="group-hover:text-accent mt-2 font-medium">
              {localized(album.title, lang)}
            </Heading>
            <p className="text-muted text-sm">
              {[
                photoCount(content, album.photos.length),
                formatDateRange(
                  album.photos.map((photo) => photo.exif?.takenAt),
                  lang
                ),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function PicturesPage({
  params,
}: PageProps<'/[lang]/pictures'>) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const content = getContent(lang);
  // A CDN outage must not block deploys; ISR refills the page on the next revalidate.
  const { albums, collections } = await getManifest().catch(() => ({
    albums: [],
    collections: [],
  }));
  const grid = (list: Album[]) => (
    <AlbumGrid albums={list} content={content} heading="h3" lang={lang} />
  );
  const slugs = new Set(collections.map((c) => c.slug));
  const loose = albums.filter(
    (a) => !(a.collection && slugs.has(a.collection))
  );
  const sections: Section[] = [
    ...collections.map((c) => ({
      slug: c.slug,
      title: localized(c.title, lang),
      content: grid(albums.filter((a) => a.collection === c.slug)),
    })),
    ...(loose.length > 0
      ? [{ title: content.ui.picturesOther, content: grid(loose) }]
      : []),
  ];
  const filter = {
    label: content.ui.picturesCollections,
    allLabel: content.ui.picturesAll,
    href: localizedPath('/pictures', lang),
    sections,
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">{content.picturesLabel}</h1>
      <p className="text-muted mt-2">{content.ui.picturesIntro}</p>
      {albums.length === 0 && (
        <p className="text-muted mt-10">{content.ui.picturesEmpty}</p>
      )}
      {albums.length > 0 && collections.length === 0 && (
        <div className="mt-10">
          <AlbumGrid albums={albums} content={content} lang={lang} />
        </div>
      )}
      {albums.length > 0 && collections.length > 0 && (
        <Suspense fallback={<CollectionSections {...filter} />}>
          <FilteredCollectionSections {...filter} />
        </Suspense>
      )}
    </>
  );
}
