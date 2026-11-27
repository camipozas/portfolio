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

/** Metadata of an album page, or of one of its photos (shared links preview that photo). */
export async function albumMetadata(
  lang: string,
  slug: string,
  photoId?: string
): Promise<Metadata> {
  if (!isLocale(lang)) {
    notFound();
  }
  const album = await getAlbum(slug);
  const photo = album?.photos.find((p) => p.id === photoId);
  if (!album || (photoId && !photo)) {
    notFound();
  }
  // A photo page shows the album, so search engines should index the album instead.
  const albumPath = `/pictures/${slug}`;
  const title = `${localized(album.title, lang)} — Camila Pozas`;
  const image = photo
    ? {
        url: photoUrl(photo.id, '1200'),
        ...previewSize(photo.width, photo.height),
      }
    : photoUrl(album.coverId, '2048');
  return {
    title,
    alternates: {
      canonical: localizedPath(albumPath, lang),
      languages: {
        en: localizedPath(albumPath, 'en'),
        es: localizedPath(albumPath, 'es'),
        'x-default': albumPath,
      },
    },
    // Replaces the layout's openGraph as a whole, so it repeats description and locale.
    openGraph: {
      title,
      description: getContent(lang).ui.picturesIntro,
      url: localizedPath(photo ? `${albumPath}/${photo.id}` : albumPath, lang),
      locale: lang === 'es' ? 'es_CL' : 'en_US',
      alternateLocale: lang === 'es' ? 'en_US' : 'es_CL',
      type: 'website',
      images: [image],
    },
    twitter: { card: 'summary_large_image' },
  };
}

// The 1200 rendition fits the long side in 1200 px.
const previewSize = (width: number, height: number) => {
  const scale = Math.min(1, 1200 / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

/** The album page; with `photoId`, its viewer opens on that photo. */
export async function AlbumView({
  lang,
  slug,
  photoId,
}: {
  lang: string;
  slug: string;
  photoId?: string;
}) {
  if (!isLocale(lang)) {
    notFound();
  }
  const { albums, collections } = await getManifest();
  const album = albums.find((a) => a.slug === slug);
  if (!album || (photoId && !album.photos.some((p) => p.id === photoId))) {
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
        basePath={localizedPath(`/pictures/${album.slug}`, lang)}
        labels={{
          close: ui.close,
          previous: ui.previousPhoto,
          next: ui.nextPhoto,
          openFullSize: ui.openFullSize,
          details: ui.photoDetails,
          closeDetails: ui.closeDetails,
          share: ui.sharePhoto,
          linkCopied: ui.linkCopied,
          swipeHint: ui.swipeHint,
          specs: {
            aperture: ui.aperture,
            shutter: ui.shutterSpeed,
            iso: 'ISO',
            focalLength: ui.focalLength,
          },
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
