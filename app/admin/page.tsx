import { AlbumsEditor } from "@/components/admin/albums-editor";
import { catalogIndex, syncState } from "@/lib/backoffice/curation";
import { requireSession } from "@/lib/backoffice/session";
import { readCatalog, readState, thumbUrl } from "@/lib/backoffice/storage";
import { logout } from "./actions";

// Hobby plan limit. A publish cut short resumes on the next click (see planPublish).
export const maxDuration = 60;

export default async function AdminPage() {
  await requireSession();
  const catalog = await readCatalog();
  const state = syncState(catalog, await readState());
  const photos = catalogIndex(catalog);

  const albums = await Promise.all(
    state.albums.map(async ({ photos: albumPhotos, ...album }) => {
      const coverId = album.coverId ?? albumPhotos[0]?.id;
      const cover = coverId && photos.get(coverId);
      return {
        ...album,
        total: albumPhotos.length,
        shown: albumPhotos.filter((photo) => photo.visible).length,
        coverUrl: cover ? await thumbUrl(cover.path) : undefined,
      };
    }),
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Albums</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-muted hover:text-accent"
          >
            Sign out
          </button>
        </form>
      </div>
      <AlbumsEditor initial={albums} />
    </>
  );
}
