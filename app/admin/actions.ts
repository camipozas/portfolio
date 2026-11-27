'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  createSession,
  SESSION_COOKIE,
  SESSION_SECONDS,
  sameText,
  sessionSecret,
  verifyPassword,
} from '@/lib/backoffice/auth';
import type { AlbumState } from '@/lib/backoffice/curation';
import {
  buildManifest,
  catalogIndex,
  inBatches,
  planPublish,
  slugify,
  syncState,
  uniqueSlug,
} from '@/lib/backoffice/curation';
import { requireSession } from '@/lib/backoffice/session';
import {
  listPublished,
  publishPhoto,
  readCatalog,
  readLoginAttempts,
  readPublishedManifest,
  readState,
  unpublishPhotos,
  writeLoginAttempts,
  writeManifest,
  writeState,
} from '@/lib/backoffice/storage';
import { SITE_URL } from '@/lib/data';
import type { Collection, Localized } from '@/lib/pictures/types';

const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

export async function login(formData: FormData): Promise<void> {
  const now = Date.now();
  const recent = (await readLoginAttempts()).failures.filter(
    (t) => now - t < LOCK_WINDOW_MS
  );
  if (recent.length >= MAX_FAILURES) {
    redirect('/admin/login?error=locked');
  }

  // Both checks always run, so timing does not reveal whether the username was right.
  const userOk = sameText(
    String(formData.get('username') ?? ''),
    process.env.ADMIN_USERNAME ?? ''
  );
  const passwordOk = verifyPassword(
    String(formData.get('password') ?? ''),
    process.env.ADMIN_PASSWORD_HASH ?? ''
  );
  if (!(userOk && passwordOk)) {
    await writeLoginAttempts({ failures: [...recent, now] });
    redirect('/admin/login?error=1');
  }

  await writeLoginAttempts({ failures: [] });
  (await cookies()).set(SESSION_COOKIE, createSession(sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: SESSION_SECONDS,
  });
  redirect('/admin');
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

async function currentState() {
  return syncState(await readCatalog(), await readState());
}

/**
 * Order, titles, visibility and collection of the albums, and order and titles of the
 * collections, from the page; slugs and photo choices stay server-side.
 * Collections stay unless `deleted`: the page may not list one created moments ago.
 */
export async function saveAlbums(
  albums: Pick<AlbumState, 'key' | 'title' | 'visible' | 'collection'>[],
  collections: Collection[],
  deleted: string[]
): Promise<void> {
  await requireSession();
  const state = await currentState();
  const known = new Map(state.collections.map((c) => [c.slug, c]));
  const listed = collections.flatMap((edit) => {
    const found = known.get(edit.slug);
    return found
      ? [{ slug: found.slug, title: cleanTitle(edit.title) ?? found.title }]
      : [];
  });
  const kept = [
    ...listed,
    ...state.collections.filter(
      (c) =>
        !(listed.some((l) => l.slug === c.slug) || deleted.includes(c.slug))
    ),
  ];
  const slugs = new Set(kept.map((c) => c.slug));
  const edits = new Map(albums.map((album) => [album.key, album]));
  const ordered = albums.flatMap((edit) =>
    state.albums.filter((album) => album.key === edit.key)
  );
  const untouched = state.albums.filter((album) => !edits.has(album.key));
  await writeState({
    collections: kept,
    albums: [...ordered, ...untouched].map((album) => {
      const edit = edits.get(album.key);
      const collection = edit ? edit.collection : album.collection;
      return {
        ...album,
        ...(edit && { title: edit.title, visible: edit.visible }),
        collection:
          collection && slugs.has(collection) ? collection : undefined,
      };
    }),
  });
}

/** Undefined without an English title: the site always shows one. */
function cleanTitle({ en, es }: Localized): Localized | undefined {
  return en.trim() ? { en: en.trim(), es: es?.trim() || undefined } : undefined;
}

export async function createCollection(input: Localized): Promise<Collection> {
  await requireSession();
  const title = cleanTitle(input);
  if (!title) {
    throw new Error('a collection needs an English title');
  }
  const state = await currentState();
  const collection = {
    slug: uniqueSlug(
      slugify(title.en),
      new Set(state.collections.map((c) => c.slug)),
      'collection'
    ),
    title,
  };
  await writeState({
    ...state,
    collections: [...state.collections, collection],
  });
  return collection;
}

export async function saveAlbumPhotos(
  key: string,
  photos: AlbumState['photos'],
  coverId: string | undefined
): Promise<void> {
  await requireSession();
  const state = await currentState();
  await writeState({
    ...state,
    albums: state.albums.map((album) =>
      album.key === key ? { ...album, photos, coverId } : album
    ),
  });
}

export async function publish() {
  await requireSession();
  if (process.env.CURATION_STATE_KEY) {
    throw new Error(
      'publishing is disabled while using a test state (CURATION_STATE_KEY)'
    );
  }
  const catalog = await readCatalog();
  const manifest = buildManifest(
    catalog,
    syncState(catalog, await readState()),
    new Date().toISOString()
  );
  const { copy, remove } = planPublish(
    manifest,
    await listPublished(),
    await readPublishedManifest()
  );
  const paths = catalogIndex(catalog);
  await inBatches(copy, 24, (id) =>
    publishPhoto(id, paths.get(id)?.path as string)
  );
  await writeManifest(manifest);
  const refreshed = await fetch(`${SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET ?? ''}` },
  }).then(
    (response) => response.ok,
    () => false
  );
  await unpublishPhotos(remove);
  return {
    albums: manifest.albums.length,
    photos: manifest.albums.reduce((n, album) => n + album.photos.length, 0),
    copied: copy.length,
    removed: remove.length,
    refreshed,
  };
}
