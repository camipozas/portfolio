import type { CurationState } from './curation';
import {
  albumStatuses,
  buildManifest,
  catalogIndex,
  hasUnpublishedChanges,
  syncState,
} from './curation';
import { readCatalog, readPublishedManifest, readState } from './storage';

/** Everything an /admin page needs: catalog, synced state and publish status. */
export async function loadOverview() {
  const [catalog, saved, published] = await Promise.all([
    readCatalog(),
    readState(),
    readPublishedManifest(),
  ]);
  const state: CurationState = syncState(catalog, saved);
  const next = buildManifest(catalog, state, '');
  return {
    state,
    photos: catalogIndex(catalog),
    pending: hasUnpublishedChanges(next, published),
    statuses: albumStatuses(
      state.albums.map((album) => album.slug),
      next,
      published
    ),
    publishedAt: published?.generatedAt,
  };
}
