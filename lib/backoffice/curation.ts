import { PHOTO_SIZES } from '@/lib/pictures/manifest';
import type {
  Album,
  Collection,
  Localized,
  Manifest,
  Photo,
  PhotoExif,
} from '@/lib/pictures/types';

export interface CatalogPhoto {
  id: string;
  path: string;
  width: number;
  height: number;
  color?: string;
  exif: PhotoExif;
}

export interface Catalog {
  generatedAt: string;
  albums: { key: string; photos: CatalogPhoto[] }[];
}

export interface AlbumState {
  key: string;
  slug: string;
  title: Localized;
  visible: boolean;
  coverId?: string;
  collection?: string;
  photos: { id: string; visible: boolean }[];
}

/** Album order is display order; so is each album's photo order and the collections'. */
export interface CurationState {
  albums: AlbumState[];
  collections: Collection[];
}

/** As stored: states saved before collections existed lack them. */
export type SavedState = Omit<CurationState, 'collections'> &
  Partial<Pick<CurationState, 'collections'>>;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) {
    return list;
  }
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function uniqueSlug(
  base: string,
  taken: Set<string>,
  fallback = 'album'
): string {
  const root = base || fallback;
  let slug = root;
  for (let n = 2; taken.has(slug); n++) {
    slug = `${root}-${n}`;
  }
  taken.add(slug);
  return slug;
}

/** New albums and photos join hidden, at the end; those gone from the catalog drop out. */
export function syncState(catalog: Catalog, state: SavedState): CurationState {
  const collections = state.collections ?? [];
  const collectionSlugs = new Set(collections.map((c) => c.slug));
  const catalogAlbums = new Map(
    catalog.albums.map((album) => [album.key, album])
  );
  const kept = state.albums.filter((album) => catalogAlbums.has(album.key));
  const taken = new Set(kept.map((album) => album.slug));
  const added = catalog.albums
    .filter((album) => !kept.some((known) => known.key === album.key))
    .map((album): AlbumState => {
      const name = album.key.split('/').at(-1) ?? album.key;
      return {
        key: album.key,
        slug: uniqueSlug(slugify(name), taken),
        title: { en: name },
        visible: false,
        photos: [],
      };
    });

  return {
    collections,
    albums: [...kept, ...added].map((album) => {
      const ids = new Set(
        catalogAlbums.get(album.key)?.photos.map((photo) => photo.id)
      );
      const photos = album.photos.filter((photo) => ids.has(photo.id));
      const known = new Set(photos.map((photo) => photo.id));
      const fresh = [...ids]
        .filter((id) => !known.has(id))
        .map((id) => ({ id, visible: false }));
      const collection =
        album.collection && collectionSlugs.has(album.collection)
          ? album.collection
          : undefined;
      return { ...album, collection, photos: [...photos, ...fresh] };
    }),
  };
}

export function catalogIndex(catalog: Catalog): Map<string, CatalogPhoto> {
  return new Map(
    catalog.albums
      .flatMap((album) => album.photos)
      .map((photo) => [photo.id, photo])
  );
}

export function buildManifest(
  catalog: Catalog,
  state: CurationState,
  generatedAt: string
): Manifest {
  const photos = catalogIndex(catalog);
  const known = new Set(state.collections.map((c) => c.slug));
  const albums = state.albums.flatMap((album): Album[] => {
    if (!album.visible) {
      return [];
    }
    const shown = album.photos
      .filter((photo) => photo.visible)
      .flatMap((photo): Photo[] => {
        const found = photos.get(photo.id);
        return found
          ? [
              {
                id: found.id,
                width: found.width,
                height: found.height,
                color: found.color,
                exif: found.exif,
              },
            ]
          : [];
      });
    if (shown.length === 0) {
      return [];
    }
    const coverId = shown.some((photo) => photo.id === album.coverId)
      ? album.coverId
      : shown[0].id;
    return [
      {
        slug: album.slug,
        title: album.title,
        coverId: coverId as string,
        photos: shown,
        collection:
          album.collection && known.has(album.collection)
            ? album.collection
            : undefined,
      },
    ];
  });
  const used = new Set(albums.map((album) => album.collection));
  const collections = state.collections.filter((c) => used.has(c.slug));
  return { version: 1, generatedAt, albums, collections };
}

const photoIds = (manifest: Manifest | undefined) =>
  new Set(
    manifest?.albums.flatMap((album) => album.photos.map((photo) => photo.id))
  );

/**
 * `published` maps each id to how many of its sizes exist. Photos of the previous
 * manifest stay one more publish: the site may still render it for up to an hour.
 */
export function planPublish(
  manifest: Manifest,
  published: Map<string, number>,
  previous?: Manifest
) {
  const wanted = photoIds(manifest);
  const recent = photoIds(previous);
  return {
    copy: [...wanted].filter(
      (id) => (published.get(id) ?? 0) < PHOTO_SIZES.length
    ),
    remove: [...published.keys()].filter(
      (id) => !(wanted.has(id) || recent.has(id))
    ),
  };
}

export function hasUnpublishedChanges(
  next: Manifest,
  published?: Manifest
): boolean {
  const shown = (manifest?: Manifest) =>
    JSON.stringify([manifest?.albums ?? [], manifest?.collections ?? []]);
  return shown(next) !== shown(published);
}

/** Runs `task` over every item, `size` at a time. */
export async function inBatches<T>(
  items: T[],
  size: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  for (let start = 0; start < items.length; start += size) {
    await Promise.all(items.slice(start, start + size).map(task));
  }
}

export type AlbumStatus = 'published' | 'changed' | 'new' | 'hidden';

/** Per album slug: is what the site shows the same as what would be published now? */
export function albumStatuses(
  slugs: string[],
  next: Manifest,
  published?: Manifest
): Map<string, AlbumStatus> {
  const live = new Map(
    published?.albums.map((a) => [a.slug, JSON.stringify(a)])
  );
  const wanted = new Map(next.albums.map((a) => [a.slug, JSON.stringify(a)]));
  return new Map(
    slugs.map((slug): [string, AlbumStatus] => {
      const now = wanted.get(slug);
      const before = live.get(slug);
      if (now === undefined) {
        return [slug, before === undefined ? 'hidden' : 'changed'];
      }
      if (before === undefined) {
        return [slug, 'new'];
      }
      return [slug, now === before ? 'published' : 'changed'];
    })
  );
}
