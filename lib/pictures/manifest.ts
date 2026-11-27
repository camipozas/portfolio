import { CLOUDFRONT_BASE } from '@/lib/data';
import type { Locale } from '@/lib/locale';
import type { Album, Collection, Localized, Manifest, Photo } from './types';

export const PICTURES_TAG = 'pictures';

const PHOTOS_BASE =
  process.env.NEXT_PUBLIC_PICTURES_BASE_URL || `${CLOUDFRONT_BASE}/photos`;

export const PHOTO_SIZES = ['thumb', '1200', '2048', 'full'] as const;
export type PhotoSize = (typeof PHOTO_SIZES)[number];

// The watermark fits in a bottom band 5% of the image width tall (scripts/photos/derive.sh).
const WATERMARK_BAND = 0.05;

/** Share of the height above the watermark: previews show only that; the viewer keeps it all. */
export function aboveWatermark({
  width,
  height,
}: Pick<Photo, 'width' | 'height'>): number {
  return 1 - (WATERMARK_BAND * width) / height;
}

export function photoUrl(id: string, size: PhotoSize): string {
  return `${PHOTOS_BASE}/p/${id}/${size}.jpg`;
}

export function localized(text: Localized | undefined, lang: Locale): string {
  if (!text) {
    return '';
  }
  // A caption may exist only in Spanish: better than nothing on the English page.
  return (lang === 'es' && text.es) || text.en || text.es || '';
}

export function parseAlbums(data: unknown): Album[] {
  const albums = (data as Partial<Manifest> | null)?.albums;
  if (!Array.isArray(albums)) {
    return [];
  }
  return albums.filter(
    (album) => Array.isArray(album?.photos) && album.photos.length > 0
  );
}

/** Manifests published before collections have none. */
export function parseCollections(data: unknown): Collection[] {
  const collections = (data as Partial<Manifest> | null)?.collections;
  return Array.isArray(collections) ? collections : [];
}

export async function getManifest(): Promise<{
  albums: Album[];
  collections: Collection[];
}> {
  const response = await fetch(`${PHOTOS_BASE}/manifest.json`, {
    next: { revalidate: 3600, tags: [PICTURES_TAG] },
  });
  // CloudFront answers 403 for a missing key: nothing published yet.
  if (response.status === 403 || response.status === 404) {
    return { albums: [], collections: [] };
  }
  // Any other failure throws, so ISR keeps serving the last good page.
  if (!response.ok) {
    throw new Error(`photos manifest: HTTP ${response.status}`);
  }
  const data = await response.json();
  return { albums: parseAlbums(data), collections: parseCollections(data) };
}

export async function getAlbums(): Promise<Album[]> {
  return (await getManifest()).albums;
}

export async function getAlbum(slug: string): Promise<Album | undefined> {
  return (await getAlbums()).find((album) => album.slug === slug);
}

/** The albums of collection `slug`; without one, those outside every collection. */
export function albumsIn(
  albums: Album[],
  collections: Collection[],
  slug?: string
): Album[] {
  const known = new Set(collections.map((c) => c.slug));
  return albums.filter(
    (album) =>
      (album.collection && known.has(album.collection)
        ? album.collection
        : undefined) === slug
  );
}

/** Up to three photos: the lead album's cover, the next albums' covers, then more of the lead. */
export function mosaicPhotos(albums: Album[], coverAlbum?: string): Photo[] {
  const lead = albums.find((a) => a.slug === coverAlbum) ?? albums[0];
  if (!lead) {
    return [];
  }
  const covers = [lead, ...albums.filter((a) => a !== lead)].map(
    (a) => a.photos.find((p) => p.id === a.coverId) ?? a.photos[0]
  );
  const unique = new Map(
    [...covers, ...lead.photos].map((photo) => [photo.id, photo])
  );
  return [...unique.values()].slice(0, 3);
}
