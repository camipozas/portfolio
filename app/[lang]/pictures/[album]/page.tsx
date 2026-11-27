import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/pictures/breadcrumb';
import { PhotoGallery } from '@/components/pictures/photo-gallery';
import { getContent, photoCount } from '@/lib/content';
import { isLocale, localizedPath } from '@/lib/locale';
import { formatDateRange } from '@/lib/pictures/exif';
import {
  albumsIn,
  getAlbum,
  getManifest,
  localized,
  photoUrl,
} from '@/lib/pictures/manifest';

// Published without a deploy: unlisted albums render on first visit. A CDN outage
// must not block deploys.
export async function generateStaticParams() {
  const { albums } = await getManifest().catch(() => ({ albums: [] }));
  return albums.map((a) => ({ album: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures/[album]'>): Promise<Metadata> {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const album = await getAlbum(slug);
  if (!album) {
    notFound();
  }
  const path = `/pictures/${slug}`;
  const title = `${localized(album.title, lang)} — Camila Pozas`;
  const url = localizedPath(path, lang);
  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath(path, 'en'),
        es: localizedPath(path, 'es'),
        'x-default': path,
      },
    },
    openGraph: {
      title,
      url,
      type: 'website',
      images: [photoUrl(album.coverId, '2048')],
    },
  };
}

export default async function AlbumPage({
  params,
}: PageProps<'/[lang]/pictures/[album]'>) {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const { albums, collections } = await getManifest();
  const album = albums.find((a) => a.slug === slug);
  if (!album) {
    notFound();
  }
  const collection = collections.find((c) => c.slug === album.collection);
  // "Next" stays within the album's collection, or among the albums without one.
  const siblings = albumsIn(albums, collections, collection?.slug);
  const position = siblings.indexOf(album);
  const next =
    siblings.length > 1
      ? siblings[(position + 1) % siblings.length]
      : undefined;
  const collectionTitle = collection && localized(collection.title, lang);
  const content = getContent(lang);
  const { ui } = content;
  const title = localized(album.title, lang);
  const dates = formatDateRange(
    album.photos.map((photo) => photo.exif?.takenAt),
    lang
  );

  return (
    <>
      <Breadcrumb
        crumbs={[
          {
            label: content.picturesLabel,
            href: localizedPath('/pictures', lang),
          },
          ...(collection && collectionTitle
            ? [
                {
                  label: collectionTitle,
                  href: localizedPath(`/pictures/c/${collection.slug}`, lang),
                },
              ]
            : []),
          { label: title },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="text-muted mt-1 mb-8 text-sm">
        {[photoCount(content, album.photos.length), dates]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <PhotoGallery
        albumTitle={title}
        labels={{
          close: ui.close,
          previous: ui.previousPhoto,
          next: ui.nextPhoto,
          openFullSize: ui.openFullSize,
          details: ui.photoDetails,
        }}
        lang={lang}
        photos={album.photos}
      />
      {next ? (
        <a
          className="group border-border hover:border-accent mt-12 flex items-center gap-4 rounded-xl border p-3 transition-colors"
          href={localizedPath(`/pictures/${next.slug}`, lang)}
        >
          {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
          <img
            alt=""
            className="size-16 rounded-lg object-cover"
            loading="lazy"
            src={photoUrl(next.coverId, 'thumb')}
          />
          <span className="flex-1">
            <span className="text-muted block text-xs">
              {collectionTitle
                ? `${ui.nextIn} ${collectionTitle}`
                : ui.nextAlbum}
            </span>
            <span className="group-hover:text-accent font-medium">
              {localized(next.title, lang)}
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="text-muted" size={18} />
        </a>
      ) : null}
    </>
  );
}
