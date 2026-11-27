import { notFound } from 'next/navigation';
import { PhotosEditor } from '@/components/admin/photos-editor';
import { catalogIndex, syncState } from '@/lib/backoffice/curation';
import { requireSession } from '@/lib/backoffice/session';
import { readCatalog, readState, thumbUrl } from '@/lib/backoffice/storage';

export default async function AlbumEditorPage({
  params,
}: PageProps<'/admin/albums/[slug]'>) {
  await requireSession();
  const { slug } = await params;
  const catalog = await readCatalog();
  const album = syncState(catalog, await readState()).albums.find(
    (a) => a.slug === slug
  );
  if (!album) {
    notFound();
  }
  const photos = catalogIndex(catalog);

  const items = await Promise.all(
    album.photos.map(async (photo) => ({
      ...photo,
      thumbUrl: await thumbUrl(photos.get(photo.id)?.path ?? ''),
    }))
  );

  return (
    <>
      <a className="text-muted hover:text-accent text-sm" href="/admin">
        ← Albums
      </a>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">{album.title.en}</h1>
      <PhotosEditor
        albumKey={album.key}
        initial={items}
        initialCoverId={album.coverId}
      />
    </>
  );
}
