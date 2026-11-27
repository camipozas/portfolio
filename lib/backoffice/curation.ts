import type {
  Album,
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
  photos: { id: string; visible: boolean }[];
}

/** Album order is display order; so is each album's photo order. */
export interface CurationState {
  albums: AlbumState[];
}

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

function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || 'album';
  let slug = root;
  for (let n = 2; taken.has(slug); n++) {
    slug = `${root}-${n}`;
  }
  taken.add(slug);
  return slug;
}

/** New albums and photos join hidden, at the end; those gone from the catalog drop out. */
export function syncState(
  catalog: Catalog,
  state: CurationState
): CurationState {
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
    albums: [...kept, ...added].map((album) => {
      const ids = new Set(
        catalogAlbums.get(album.key)?.photos.map((photo) => photo.id)
      );
      const photos = album.photos.filter((photo) => ids.has(photo.id));
      const known = new Set(photos.map((photo) => photo.id));
      const fresh = [...ids]
        .filter((id) => !known.has(id))
        .map((id) => ({ id, visible: false }));
      return { ...album, photos: [...photos, ...fresh] };
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
      },
    ];
  });
  return { version: 1, generatedAt, albums };
}

const photoIds = (manifest: Manifest | undefined) =>
  new Set(
    manifest?.albums.flatMap((album) => album.photos.map((photo) => photo.id))
  );

/**
 * `published` maps each id to how many of its 3 sizes exist. Photos of the previous
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
    copy: [...wanted].filter((id) => (published.get(id) ?? 0) < 3),
    remove: [...published.keys()].filter(
      (id) => !(wanted.has(id) || recent.has(id))
    ),
  };
}

export function hasUnpublishedChanges(
  next: Manifest,
  published?: Manifest
): boolean {
  return (
    JSON.stringify(next.albums) !== JSON.stringify(published?.albums ?? [])
  );
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
