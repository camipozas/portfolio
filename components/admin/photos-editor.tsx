"use client";

import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { saveAlbumPhotos } from "@/app/admin/actions";
import { move } from "@/lib/backoffice/curation";

interface PhotoItem {
  id: string;
  visible: boolean;
  thumbUrl: string;
}

interface PhotosEditorProps {
  albumKey: string;
  initialCoverId?: string;
  initial: PhotoItem[];
}

export function PhotosEditor({
  albumKey,
  initialCoverId,
  initial,
}: PhotosEditorProps) {
  const [photos, setPhotos] = useState(initial);
  const [coverId, setCoverId] = useState(initialCoverId);
  const [dragged, setDragged] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();

  const setAll = (visible: boolean) =>
    setPhotos((list) => list.map((p) => ({ ...p, visible })));
  const toggle = (i: number) =>
    setPhotos((list) =>
      list.map((p, j) => (j === i ? { ...p, visible: !p.visible } : p)),
    );
  const save = () =>
    startTransition(async () => {
      try {
        await saveAlbumPhotos(
          albumKey,
          photos.map(({ id, visible }) => ({ id, visible })),
          coverId,
        );
        setStatus("Saved. Publish from the albums page.");
      } catch (error) {
        setStatus(
          `Error: ${(error as Error).message}. Nothing was lost; try again.`,
        );
      }
    });

  return (
    <>
      <div className="mb-4 flex gap-3 text-sm">
        <button
          type="button"
          onClick={() => setAll(true)}
          className="text-accent hover:underline"
        >
          Show all
        </button>
        <button
          type="button"
          onClick={() => setAll(false)}
          className="text-accent hover:underline"
        >
          Hide all
        </button>
        <span className="text-muted">
          {photos.filter((p) => p.visible).length}/{photos.length} shown · drag
          or use the arrows to reorder
        </span>
      </div>
      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {photos.map((photo, i) => (
          <li
            key={photo.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", photo.id);
              setDragged(i);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() =>
              dragged !== null && setPhotos((list) => move(list, dragged, i))
            }
            className="group relative"
          >
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={photo.visible}
              aria-label={`Photo ${i + 1}: ${photo.visible ? "shown, click to hide" : "hidden, click to show"}`}
              className={`block w-full overflow-hidden rounded ring-accent focus-visible:ring-2 ${photo.visible ? "" : "opacity-30 grayscale"}`}
            >
              {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
              <img
                src={photo.thumbUrl}
                alt=""
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button
                type="button"
                onClick={() => setPhotos((l) => move(l, i, i - 1))}
                aria-label={`Move photo ${i + 1} earlier`}
                className="rounded bg-black/60 p-1 text-white"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                type="button"
                onClick={() => setCoverId(photo.id)}
                aria-label={`Use photo ${i + 1} as album cover`}
                aria-pressed={coverId === photo.id}
                className="rounded bg-black/60 p-1 text-white"
              >
                <Star
                  size={12}
                  fill={coverId === photo.id ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={() => setPhotos((l) => move(l, i, i + 1))}
                aria-label={`Move photo ${i + 1} later`}
                className="rounded bg-black/60 p-1 text-white"
              >
                <ArrowRight size={12} />
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
          className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          Save
        </button>
        <p role="status" className="text-sm text-muted">
          {pending ? "Saving…" : status}
        </p>
      </div>
    </>
  );
}
