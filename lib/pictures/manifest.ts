import { CLOUDFRONT_BASE } from '@/lib/data';
import type { Locale } from '@/lib/locale';
import type { Album, Localized, Manifest } from './types';

export const PICTURES_TAG = 'pictures';

const PHOTOS_BASE =
  process.env.NEXT_PUBLIC_PICTURES_BASE_URL || `${CLOUDFRONT_BASE}/photos`;

export type PhotoSize = 'thumb' | '2048' | 'full';

export function photoUrl(id: string, size: PhotoSize): string {
  return `${PHOTOS_BASE}/p/${id}/${size}.jpg`;
}

export function localized(text: Localized | undefined, lang: Locale): string {
  if (!text) {
    return '';
  }
  return (lang === 'es' && text.es) || text.en;
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

export async function getAlbums(): Promise<Album[]> {
  const response = await fetch(`${PHOTOS_BASE}/manifest.json`, {
    next: { revalidate: 3600, tags: [PICTURES_TAG] },
  });
  // CloudFront answers 403 for a missing key: nothing published yet.
  if (response.status === 403 || response.status === 404) {
    return [];
  }
  // Any other failure throws, so ISR keeps serving the last good page.
  if (!response.ok) {
    throw new Error(`photos manifest: HTTP ${response.status}`);
  }
  return parseAlbums(await response.json());
}

export async function getAlbum(slug: string): Promise<Album | undefined> {
  return (await getAlbums()).find((album) => album.slug === slug);
}
