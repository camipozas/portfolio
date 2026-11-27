import { describe, expect, it } from 'vitest';
import {
  createSession,
  hashPassword,
  isValidSession,
  SESSION_SECONDS,
  sameText,
  verifyPassword,
} from '@/lib/backoffice/auth';
import type { Catalog, SavedState } from '@/lib/backoffice/curation';
import {
  albumStatuses,
  buildManifest,
  hasUnpublishedChanges,
  inBatches,
  move,
  planPublish,
  slugify,
  syncState,
  uniqueSlug,
} from '@/lib/backoffice/curation';

describe('password', () => {
  it('should accept the right password and reject a wrong one', () => {
    const stored = hashPassword('correct horse');
    expect(verifyPassword('correct horse', stored)).toBe(true);
    expect(verifyPassword('wrong horse', stored)).toBe(false);
  });

  it('should produce a hash a .env file cannot mangle', () => {
    expect(hashPassword('x')).not.toContain('$');
  });

  it('should reject a malformed stored hash, including one with an empty digest', () => {
    expect(verifyPassword('x', 'plain-text')).toBe(false);
    expect(verifyPassword('anything', 'scrypt:abc:A')).toBe(false);
  });

  it('should compare usernames of different lengths without throwing', () => {
    expect(sameText('cami', 'cami')).toBe(true);
    expect(sameText('cami', 'camila')).toBe(false);
  });
});

describe('session', () => {
  const secret = 's'.repeat(32);

  it('should accept its own session until it expires', () => {
    const now = 1_000_000;
    const token = createSession(secret, now);
    expect(isValidSession(token, secret, now + 1000)).toBe(true);
    expect(
      isValidSession(token, secret, now + SESSION_SECONDS * 1000 + 1)
    ).toBe(false);
  });

  it('should reject a tampered expiry, another secret or no cookie', () => {
    const token = createSession(secret, 0);
    const [, signature] = token.split('.');
    expect(isValidSession(`9999999999999.${signature}`, secret, 0)).toBe(false);
    expect(isValidSession(token, 'other'.repeat(8), 0)).toBe(false);
    expect(isValidSession(undefined, secret, 0)).toBe(false);
  });
});

const photo = (id: string) => ({
  id,
  path: `A/${id}`,
  width: 300,
  height: 200,
  exif: { iso: 100 },
});
const catalog: Catalog = {
  generatedAt: '2026-11-27T00:00:00Z',
  albums: [
    {
      key: 'Croacia + Mostar ‘25',
      photos: [photo('a'), photo('b'), photo('c')],
    },
    { key: 'BKT/parque guay guay', photos: [photo('d')] },
  ],
};

describe('syncState', () => {
  it('should add new albums and photos hidden, with a slug from the album name', () => {
    const state = syncState(catalog, { albums: [] });
    expect(state.albums.map((album) => [album.slug, album.visible])).toEqual([
      ['croacia-mostar-25', false],
      ['parque-guay-guay', false],
    ]);
    expect(state.albums[0].photos.every((p) => !p.visible)).toBe(true);
  });

  it('should not give an album the slug "c", which the collection pages use', () => {
    const state = syncState(
      { generatedAt: '', albums: [{ key: 'C', photos: [] }] },
      { albums: [] }
    );
    expect(state.albums[0].slug).toBe('c-2');
  });

  it('should keep existing choices and order, append new photos and drop missing ones', () => {
    const previous: SavedState = {
      albums: [
        {
          key: 'Croacia + Mostar ‘25',
          slug: 'croatia',
          title: { en: 'Croatia', es: 'Croacia' },
          visible: true,
          photos: [
            { id: 'c', visible: true },
            { id: 'gone', visible: true },
            { id: 'a', visible: false },
          ],
        },
      ],
    };
    const [croatia] = syncState(catalog, previous).albums;
    expect(croatia.slug).toBe('croatia');
    expect(croatia.photos).toEqual([
      { id: 'c', visible: true },
      { id: 'a', visible: false },
      { id: 'b', visible: false },
    ]);
  });

  it('should keep collections and drop references to a deleted one', () => {
    const saved = syncState(catalog, { albums: [] });
    saved.albums[0].collection = 'trips';
    saved.albums[1].collection = 'gone';
    const state = syncState(catalog, {
      ...saved,
      collections: [{ slug: 'trips', title: { en: 'Trips' } }],
    });
    expect(state.collections).toEqual([
      { slug: 'trips', title: { en: 'Trips' } },
    ]);
    expect(state.albums.map((album) => album.collection)).toEqual([
      'trips',
      undefined,
    ]);
  });

  it('should treat a state saved before collections as having none', () => {
    expect(syncState(catalog, { albums: [] }).collections).toEqual([]);
  });
});

describe('buildManifest', () => {
  it('should publish only visible photos of visible albums, in the chosen order', () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[0] = {
      ...state.albums[0],
      visible: true,
      coverId: 'a',
      photos: [
        { id: 'c', visible: true },
        { id: 'a', visible: false },
        { id: 'b', visible: true },
      ],
    };
    const manifest = buildManifest(catalog, state, 'now');
    expect(manifest.albums).toHaveLength(1);
    expect(manifest.albums[0].photos.map((p) => p.id)).toEqual(['c', 'b']);
    expect(manifest.albums[0].coverId).toBe('c');
  });

  it('should leave out a visible album with no visible photos', () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[1].visible = true;
    expect(buildManifest(catalog, state, 'now').albums).toEqual([]);
  });

  it('should publish, in order, only the collections with a published album', () => {
    const state = syncState(catalog, { albums: [] });
    state.collections = [
      { slug: 'empty', title: { en: 'Empty' } },
      { slug: 'dogs', title: { en: 'Dogs' } },
      { slug: 'trips', title: { en: 'Trips', es: 'Viajes' } },
    ];
    state.albums = state.albums.map((album, i) => ({
      ...album,
      visible: true,
      collection: ['trips', 'dogs'][i],
      photos: album.photos.map((p) => ({ ...p, visible: true })),
    }));
    const manifest = buildManifest(catalog, state, 'now');
    expect(manifest.collections?.map((c) => c.slug)).toEqual(['dogs', 'trips']);
    expect(manifest.albums.map((album) => album.collection)).toEqual([
      'trips',
      'dogs',
    ]);
  });

  it('should carry the description and keep a cover only if it is a published album of the collection', () => {
    const state = syncState(catalog, { albums: [] });
    const description = { en: 'Cities', es: 'Ciudades' };
    state.collections = [
      { slug: 'trips', title: { en: 'Trips' }, description, coverAlbum: 'b' },
      { slug: 'dogs', title: { en: 'Dogs' }, coverAlbum: 'a' },
    ];
    state.albums = state.albums.map((album, i) => ({
      ...album,
      slug: ['a', 'b'][i],
      visible: true,
      collection: ['dogs', 'trips'][i],
      photos: album.photos.map((p) => ({ ...p, visible: true })),
    }));
    expect(buildManifest(catalog, state, 'now').collections).toEqual([
      { slug: 'trips', title: { en: 'Trips' }, description, coverAlbum: 'b' },
      { slug: 'dogs', title: { en: 'Dogs' }, coverAlbum: 'a' },
    ]);
    state.collections[0].coverAlbum = 'a';
    expect(
      buildManifest(catalog, state, 'now').collections?.[0].coverAlbum
    ).toBeUndefined();
  });

  it('should leave out the collection of an album when it no longer exists', () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[1] = {
      ...state.albums[1],
      visible: true,
      collection: 'gone',
      photos: [{ id: 'd', visible: true }],
    };
    const manifest = buildManifest(catalog, state, 'now');
    expect(manifest.albums[0].collection).toBeUndefined();
    expect(manifest.collections).toEqual([]);
  });
});

describe('planPublish', () => {
  const manifestWith = (...ids: string[]) =>
    buildManifest(
      catalog,
      {
        collections: [],
        albums: [
          {
            key: 'Croacia + Mostar ‘25',
            slug: 'c',
            title: { en: 'C' },
            visible: true,
            photos: ids.map((id) => ({ id, visible: true })),
          },
        ],
      },
      'now'
    );

  it('should copy new photos and photos missing a size', () => {
    const published = new Map([
      ['a', 4],
      ['b', 1],
    ]);
    expect(planPublish(manifestWith('a', 'b', 'c'), published).copy).toEqual([
      'b',
      'c',
    ]);
  });

  it('should keep photos of the previous manifest for one more publish', () => {
    const published = new Map([
      ['a', 4],
      ['b', 4],
      ['c', 4],
    ]);
    const plan = planPublish(
      manifestWith('a'),
      published,
      manifestWith('a', 'b')
    );
    expect(plan.remove).toEqual(['c']);
  });
});

describe('helpers', () => {
  it('should slugify accents, quotes and symbols', () => {
    expect(slugify('España ‘25')).toBe('espana-25');
    expect(slugify('Bélgica')).toBe('belgica');
    expect(slugify('日本')).toBe('');
  });

  it('should number repeated slugs and use the fallback for an empty one', () => {
    const taken = new Set(['trips']);
    expect(uniqueSlug('trips', taken, 'collection')).toBe('trips-2');
    expect(uniqueSlug('trips', taken, 'collection')).toBe('trips-3');
    expect(uniqueSlug(slugify('日本'), taken, 'collection')).toBe('collection');
  });

  it('should move an item and ignore moves out of range', () => {
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(move(['a', 'b'], 1, 2)).toEqual(['a', 'b']);
  });
});

describe('hasUnpublishedChanges', () => {
  it('should be clean when nothing is shown and nothing was published', () => {
    expect(
      hasUnpublishedChanges(
        buildManifest(catalog, syncState(catalog, { albums: [] }), 'now')
      )
    ).toBe(false);
  });

  it('should ignore the publish time and notice a different selection', () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[0] = {
      ...state.albums[0],
      visible: true,
      photos: [{ id: 'a', visible: true }],
    };
    const published = buildManifest(catalog, state, 'yesterday');
    expect(
      hasUnpublishedChanges(buildManifest(catalog, state, 'now'), published)
    ).toBe(false);
    state.albums[0].photos.push({ id: 'b', visible: true });
    expect(
      hasUnpublishedChanges(buildManifest(catalog, state, 'now'), published)
    ).toBe(true);
  });

  it('should notice a renamed collection and not a manifest saved before collections', () => {
    const state = syncState(catalog, { albums: [] });
    state.collections = [{ slug: 'trips', title: { en: 'Trips' } }];
    state.albums[0] = {
      ...state.albums[0],
      visible: true,
      photos: [{ id: 'a', visible: true }],
    };
    const { collections: _, ...beforeCollections } = buildManifest(
      catalog,
      state,
      'then'
    );
    expect(
      hasUnpublishedChanges(
        buildManifest(catalog, state, 'now'),
        beforeCollections
      )
    ).toBe(false);
    state.albums[0].collection = 'trips';
    const published = buildManifest(catalog, state, 'then');
    state.collections = [{ slug: 'trips', title: { en: 'Travel' } }];
    expect(
      hasUnpublishedChanges(buildManifest(catalog, state, 'now'), published)
    ).toBe(true);
  });
});

describe('inBatches', () => {
  it('should run the task for every item, never more than size at once', async () => {
    const seen: number[] = [];
    let running = 0;
    let peak = 0;
    await inBatches(
      Array.from({ length: 50 }, (_, i) => i),
      24,
      async (item) => {
        running += 1;
        peak = Math.max(peak, running);
        await Promise.resolve();
        seen.push(item);
        running -= 1;
      }
    );
    expect(seen.toSorted((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i)
    );
    expect(peak).toBeLessThanOrEqual(24);
  });
});

describe('albumStatuses', () => {
  it('should tell published, changed, new and hidden albums apart', () => {
    const state = syncState(catalog, { albums: [] });
    state.albums[0] = {
      ...state.albums[0],
      visible: true,
      photos: [{ id: 'a', visible: true }],
    };
    const published = buildManifest(catalog, state, 'then');
    state.albums[0].photos.push({ id: 'b', visible: true });
    state.albums[1] = {
      ...state.albums[1],
      visible: true,
      photos: [{ id: 'd', visible: true }],
    };
    const statuses = albumStatuses(
      [...state.albums.map((a) => a.slug), 'gone'],
      buildManifest(catalog, state, 'now'),
      published
    );
    expect(Object.fromEntries(statuses)).toEqual({
      'croacia-mostar-25': 'changed',
      'parque-guay-guay': 'new',
      gone: 'hidden',
    });
  });
});
