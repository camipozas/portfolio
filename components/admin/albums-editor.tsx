"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { publish, saveAlbums } from "@/app/admin/actions";
import { type AlbumState, move } from "@/lib/backoffice/curation";

type AlbumRow = Omit<AlbumState, "photos"> & {
  total: number;
  shown: number;
  coverUrl?: string;
};

export function AlbumsEditor({ initial }: { initial: AlbumRow[] }) {
  const [albums, setAlbums] = useState(initial);
  const [dragged, setDragged] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const update = (i: number, patch: Partial<AlbumRow>) =>
    setAlbums((list) =>
      list.map((album, j) => (j === i ? { ...album, ...patch } : album)),
    );
  const toState = () =>
    albums.map(({ key, title, visible }) => ({ key, title, visible }));
  const run = (task: () => Promise<string>) =>
    startTransition(async () => {
      try {
        setStatus(await task());
      } catch (error) {
        setStatus(
          `Error: ${(error as Error).message}. Nothing was lost; try again.`,
        );
      }
    });

  const save = () =>
    run(async () => {
      await saveAlbums(toState());
      return "Saved.";
    });
  const saveAndPublish = () =>
    run(async () => {
      await saveAlbums(toState());
      const result = await publish();
      return `Published ${result.albums} albums, ${result.photos} photos (${result.copied} new, ${result.removed} removed). The site updates within an hour.`;
    });

  return (
    <>
      <ol className="flex flex-col gap-2">
        {albums.map((album, i) => (
          <li
            key={album.key}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", album.key);
              setDragged(i);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() =>
              dragged !== null && setAlbums((list) => move(list, dragged, i))
            }
            className={`flex items-center gap-3 rounded-md border border-border p-2 ${album.visible ? "" : "opacity-60"}`}
          >
            {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
            <img
              src={album.coverUrl}
              alt=""
              className="size-14 rounded object-cover"
            />
            <div className="grid flex-1 gap-1 sm:grid-cols-2">
              <input
                aria-label={`English title of ${album.key}`}
                value={album.title.en}
                onChange={(e) =>
                  update(i, { title: { ...album.title, en: e.target.value } })
                }
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <input
                aria-label={`Spanish title of ${album.key}`}
                placeholder="Título en español"
                value={album.title.es ?? ""}
                onChange={(e) =>
                  update(i, {
                    title: { ...album.title, es: e.target.value || undefined },
                  })
                }
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              />
              <p className="text-xs text-muted sm:col-span-2">
                {album.key} · /pictures/{album.slug} · {album.shown}/
                {album.total} shown ·{" "}
                <a
                  href={`/admin/albums/${album.slug}`}
                  className="text-accent hover:underline"
                >
                  Edit photos
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={() => update(i, { visible: !album.visible })}
              aria-label={
                album.visible ? `Hide ${album.key}` : `Show ${album.key}`
              }
              aria-pressed={album.visible}
              className="rounded p-2 hover:bg-border"
            >
              {album.visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setAlbums((l) => move(l, i, i - 1))}
                aria-label={`Move ${album.key} up`}
                className="rounded p-1 hover:bg-border"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => setAlbums((l) => move(l, i, i + 1))}
                aria-label={`Move ${album.key} down`}
                className="rounded p-1 hover:bg-border"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="sticky bottom-0 mt-6 flex items-center gap-3 bg-background py-4">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-md border border-border px-4 py-2 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={saveAndPublish}
          className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          Save and publish
        </button>
        <p role="status" className="text-sm text-muted">
          {pending ? "Working…" : status}
        </p>
      </div>
    </>
  );
}
