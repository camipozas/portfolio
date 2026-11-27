'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff } from 'lucide-react';
import { useState, useTransition } from 'react';
import { publish, saveAlbums } from '@/app/admin/actions';
import type { AlbumState } from '@/lib/backoffice/curation';
import { move } from '@/lib/backoffice/curation';

type AlbumRow = Omit<AlbumState, 'photos'> & {
  total: number;
  shown: number;
  coverUrl?: string;
};

export function AlbumsEditor({ initial }: { initial: AlbumRow[] }) {
  const [albums, setAlbums] = useState(initial);
  const [dragged, setDragged] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<AlbumRow>) =>
    setAlbums((list) =>
      list.map((album, j) => (j === i ? { ...album, ...patch } : album))
    );
  const toState = () =>
    albums.map(({ key, title, visible }) => ({ key, title, visible }));
  const run = (task: () => Promise<string>) =>
    startTransition(async () => {
      try {
        setStatus(await task());
      } catch (error) {
        setStatus(
          `Error: ${(error as Error).message}. Nothing was lost; try again.`
        );
      }
    });

  const save = () =>
    run(async () => {
      await saveAlbums(toState());
      return 'Saved.';
    });
  const saveAndPublish = () =>
    run(async () => {
      await saveAlbums(toState());
      const result = await publish();
      return `Published ${result.albums} albums, ${result.photos} photos (${result.copied} new, ${result.removed} removed). The site updates within an hour.`;
    });

  const message = pending ? 'Working…' : status;

  return (
    <>
      <ol className="flex flex-col gap-2">
        {albums.map((album, i) => (
          <li
            className={`border-border flex items-center gap-3 rounded-md border p-2 ${album.visible ? '' : 'opacity-60'}`}
            draggable
            key={album.key}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', album.key);
              setDragged(i);
            }}
            onDrop={() =>
              dragged !== null && setAlbums((list) => move(list, dragged, i))
            }
          >
            {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
            <img
              alt=""
              className="size-14 rounded object-cover"
              src={album.coverUrl}
            />
            <div className="grid flex-1 gap-1 sm:grid-cols-2">
              <input
                aria-label={`English title of ${album.key}`}
                className="border-border bg-background rounded border px-2 py-1 text-sm"
                onChange={(e) =>
                  update(i, { title: { ...album.title, en: e.target.value } })
                }
                value={album.title.en}
              />
              <input
                aria-label={`Spanish title of ${album.key}`}
                className="border-border bg-background rounded border px-2 py-1 text-sm"
                onChange={(e) =>
                  update(i, {
                    title: { ...album.title, es: e.target.value || undefined },
                  })
                }
                placeholder="Título en español"
                value={album.title.es ?? ''}
              />
              <p className="text-muted text-xs sm:col-span-2">
                {album.key} · /pictures/{album.slug} · {album.shown}/
                {album.total} shown ·{' '}
                <a
                  className="text-accent hover:underline"
                  href={`/admin/albums/${album.slug}`}
                >
                  Edit photos
                </a>
              </p>
            </div>
            <button
              aria-label={
                album.visible ? `Hide ${album.key}` : `Show ${album.key}`
              }
              aria-pressed={album.visible}
              className="hover:bg-border rounded p-2"
              onClick={() => update(i, { visible: !album.visible })}
              type="button"
            >
              {album.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <div className="flex flex-col">
              <button
                aria-label={`Move ${album.key} up`}
                className="hover:bg-border rounded p-1"
                onClick={() => setAlbums((l) => move(l, i, i - 1))}
                type="button"
              >
                <ArrowUp size={14} />
              </button>
              <button
                aria-label={`Move ${album.key} down`}
                className="hover:bg-border rounded p-1"
                onClick={() => setAlbums((l) => move(l, i, i + 1))}
                type="button"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="bg-background sticky bottom-0 mt-6 flex items-center gap-3 py-4">
        <button
          className="border-border rounded-md border px-4 py-2 disabled:opacity-50"
          disabled={pending}
          onClick={save}
          type="button"
        >
          Save
        </button>
        <button
          className="bg-foreground text-background rounded-md px-4 py-2 disabled:opacity-50"
          disabled={pending}
          onClick={saveAndPublish}
          type="button"
        >
          Save and publish
        </button>
        <p className="text-muted text-sm" role="status">
          {message}
        </p>
      </div>
    </>
  );
}
