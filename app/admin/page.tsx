import { AlbumsEditor } from '@/components/admin/albums-editor';
import { loadOverview } from '@/lib/backoffice/overview';
import { requireSession } from '@/lib/backoffice/session';
import { webUrl } from '@/lib/backoffice/storage';

// Hobby plan limit. A publish cut short resumes on the next click (see planPublish).
export const maxDuration = 60;

export default async function AdminPage() {
  await requireSession();
  const { state, photos, pending, publishedAt, statuses } =
    await loadOverview();

  const albums = await Promise.all(
    state.albums.map(
      async ({
        photos: albumPhotos,
        key,
        slug,
        title,
        visible,
        coverId,
        collection,
      }) => {
        const cover = photos.get(
          coverId ??
            albumPhotos.find((p) => p.visible)?.id ??
            albumPhotos[0]?.id ??
            ''
        );
        return {
          key,
          slug,
          title,
          visible,
          collection,
          status: statuses.get(slug) ?? 'hidden',
          total: albumPhotos.length,
          shown: albumPhotos.filter((photo) => photo.visible).length,
          coverUrl: cover ? await webUrl(cover.path) : undefined,
        };
      }
    )
  );

  return (
    <AlbumsEditor
      initial={albums}
      initialCollections={state.collections}
      initialPending={pending}
      publishedAt={publishedAt}
    />
  );
}
