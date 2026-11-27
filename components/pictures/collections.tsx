import { ArrowRight } from 'lucide-react';
import type { Content } from '@/lib/content';
import { albumCount, photoCount } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { localizedPath } from '@/lib/locale';
import { formatDateRange } from '@/lib/pictures/exif';
import {
  aboveWatermark,
  localized,
  mosaicPhotos,
  photoUrl,
} from '@/lib/pictures/manifest';
import type { Album, Collection } from '@/lib/pictures/types';
import { cn } from '@/lib/utils';

export function collectionStats(
  content: Content,
  albums: Album[],
  lang: Locale
): string {
  const photos = albums.flatMap((album) => album.photos);
  return [
    albumCount(content, albums.length),
    photoCount(content, photos.length),
    formatDateRange(
      photos.map((photo) => photo.exif?.takenAt),
      lang
    ),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** One large tile and two small ones; phones show only the large one. */
export function CollectionMosaic({
  albums,
  coverAlbum,
  eager = false,
}: {
  albums: Album[];
  coverAlbum?: string;
  eager?: boolean;
}) {
  const photos = mosaicPhotos(albums, coverAlbum);
  return (
    <div className="grid aspect-[3/2] gap-1 overflow-hidden rounded-xl sm:aspect-[9/4] sm:grid-cols-3 sm:grid-rows-2">
      {photos.map((photo, i) => (
        <div
          className={cn(
            'bg-border relative overflow-hidden',
            i === 0 && photos.length === 1 && 'sm:col-span-3 sm:row-span-2',
            i === 0 && photos.length > 1 && 'sm:col-span-2 sm:row-span-2',
            i > 0 && 'hidden sm:block',
            i > 0 && photos.length === 2 && 'sm:row-span-2'
          )}
          key={photo.id}
          style={{ backgroundColor: photo.color }}
        >
          {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
          <img
            alt=""
            className="absolute inset-x-0 top-0 w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]"
            decoding="async"
            fetchPriority={eager && i === 0 ? 'high' : undefined}
            loading={eager && i === 0 ? 'eager' : 'lazy'}
            sizes={
              i === 0
                ? '(min-width: 1152px) 740px, (min-width: 640px) 66vw, 100vw'
                : '(min-width: 1152px) 370px, 33vw'
            }
            src={photoUrl(photo.id, 'thumb')}
            srcSet={`${photoUrl(photo.id, 'thumb')} 600w, ${photoUrl(photo.id, '1200')} 1200w`}
            // Taller than the tile, so the watermarked bottom strip of the 1200 falls outside it.
            style={{ height: `${100 / aboveWatermark(photo)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function CollectionCard({
  collection,
  albums,
  content,
  lang,
  eager,
}: {
  collection: Collection;
  albums: Album[];
  content: Content;
  lang: Locale;
  eager?: boolean;
}) {
  const description = localized(collection.description, lang);
  return (
    <a
      className="group focus-visible:outline-accent block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
      href={localizedPath(`/pictures/c/${collection.slug}`, lang)}
    >
      <CollectionMosaic
        albums={albums}
        coverAlbum={collection.coverAlbum}
        eager={eager}
      />
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="group-hover:text-accent flex items-center gap-2 text-xl font-semibold transition-colors">
          {localized(collection.title, lang)}
          <ArrowRight
            aria-hidden="true"
            className="text-muted motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
            size={18}
          />
        </h2>
        <p className="text-muted text-sm">
          {collectionStats(content, albums, lang)}
        </p>
      </div>
      {description && <p className="text-muted mt-1">{description}</p>}
    </a>
  );
}

/** Links, not a client filter, so every view is its own prerendered page. */
export function CollectionTabs({
  collections,
  active,
  content,
  lang,
}: {
  collections: Collection[];
  active?: string;
  content: Content;
  lang: Locale;
}) {
  const tabs = [
    {
      slug: undefined,
      title: content.ui.picturesAll,
      href: localizedPath('/pictures', lang),
    },
    ...collections.map((c) => ({
      slug: c.slug,
      title: localized(c.title, lang),
      href: localizedPath(`/pictures/c/${c.slug}`, lang),
    })),
  ];
  return (
    <nav
      aria-label={content.ui.picturesCollections}
      className="bg-background/80 sticky top-14 z-40 -mx-6 mt-4 overflow-x-auto px-6 py-3 backdrop-blur-sm"
    >
      <ul className="border-border inline-flex gap-1 rounded-full border p-1">
        {tabs.map((tab) => {
          const current = tab.slug === active;
          return (
            <li key={tab.slug ?? ''}>
              <a
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'group focus-visible:outline-accent block rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
                  current ? 'bg-foreground' : 'hover:bg-border'
                )}
                href={tab.href}
              >
                {/* The global `a { color: inherit }` beats a class on the link itself. */}
                <span
                  className={cn(
                    current
                      ? 'text-background'
                      : 'text-muted group-hover:text-foreground'
                  )}
                >
                  {tab.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
