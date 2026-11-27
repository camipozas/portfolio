import { notFound } from 'next/navigation';
import { PhotosEditor } from '@/components/admin/photos-editor';
import { loadOverview } from '@/lib/backoffice/overview';
import { requireSession } from '@/lib/backoffice/session';
import { thumbUrl } from '@/lib/backoffice/storage';

export const maxDuration = 60;

export default async function AlbumEditorPage({
  params,
}: PageProps<'/admin/albums/[slug]'>) {
  await requireSession();
  const { slug } = await params;
  const { state, photos, pending, publishedAt } = await loadOverview();
  const album = state.albums.find((a) => a.slug === slug);
  if (!album) {
    notFound();
  }

  const tiles = await Promise.all(
    album.photos.map(async (photo) => {
      const found = photos.get(photo.id);
      return {
        ...photo,
        thumbUrl: await thumbUrl(found?.path ?? ''),
        takenAt: found?.exif.takenAt,
      };
    })
  );

  return (
    <PhotosEditor
      albumKey={album.key}
      albumTitle={album.title.es || album.title.en}
      initial={tiles}
      initialCoverId={album.coverId}
      initialPending={pending}
      publishedAt={publishedAt}
    />
  );
}
