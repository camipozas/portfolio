import type { CurationState } from './curation';
import {
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
  return {
    state,
    photos: catalogIndex(catalog),
    pending: hasUnpublishedChanges(
      buildManifest(catalog, state, ''),
      published
    ),
    publishedAt: published?.generatedAt,
  };
}
