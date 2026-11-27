'use client';

import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useState, useTransition } from 'react';
import { saveAlbumPhotos } from '@/app/admin/actions';
import { move } from '@/lib/backoffice/curation';

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
  const [status, setStatus] = useState('');
  const [pending, startTransition] = useTransition();

  const setAll = (visible: boolean) =>
    setPhotos((list) => list.map((p) => ({ ...p, visible })));
  const toggle = (i: number) =>
    setPhotos((list) =>
      list.map((p, j) => (j === i ? { ...p, visible: !p.visible } : p))
    );
  const save = () =>
    startTransition(async () => {
      try {
        await saveAlbumPhotos(
          albumKey,
          photos.map(({ id, visible }) => ({ id, visible })),
          coverId
        );
        setStatus('Saved. Publish from the albums page.');
      } catch (error) {
        setStatus(
          `Error: ${(error as Error).message}. Nothing was lost; try again.`
        );
      }
    });

  return (
    <>
      <div className="mb-4 flex gap-3 text-sm">
        <button
          className="text-accent hover:underline"
          onClick={() => setAll(true)}
          type="button"
        >
          Show all
        </button>
        <button
          className="text-accent hover:underline"
          onClick={() => setAll(false)}
          type="button"
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
            className="group relative"
            draggable
            key={photo.id}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', photo.id);
              setDragged(i);
            }}
            onDrop={() =>
              dragged !== null && setPhotos((list) => move(list, dragged, i))
            }
          >
            <button
              aria-label={`Photo ${i + 1}: ${photo.visible ? 'shown, click to hide' : 'hidden, click to show'}`}
              aria-pressed={photo.visible}
              className={`ring-accent block w-full overflow-hidden rounded focus-visible:ring-2 ${photo.visible ? '' : 'opacity-30 grayscale'}`}
              onClick={() => toggle(i)}
              type="button"
            >
              {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
              <img
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
                src={photo.thumbUrl}
              />
            </button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button
                aria-label={`Move photo ${i + 1} earlier`}
                className="rounded bg-black/60 p-1 text-white"
                onClick={() => setPhotos((l) => move(l, i, i - 1))}
                type="button"
              >
                <ArrowLeft size={12} />
              </button>
              <button
                aria-label={`Use photo ${i + 1} as album cover`}
                aria-pressed={coverId === photo.id}
                className="rounded bg-black/60 p-1 text-white"
                onClick={() => setCoverId(photo.id)}
                type="button"
              >
                <Star
                  fill={coverId === photo.id ? 'currentColor' : 'none'}
                  size={12}
                />
              </button>
              <button
                aria-label={`Move photo ${i + 1} later`}
                className="rounded bg-black/60 p-1 text-white"
                onClick={() => setPhotos((l) => move(l, i, i + 1))}
                type="button"
              >
                <ArrowRight size={12} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="bg-background sticky bottom-0 mt-6 flex items-center gap-3 py-4">
        <button
          className="bg-foreground text-background rounded-md px-4 py-2 disabled:opacity-50"
          disabled={pending}
          onClick={save}
          type="button"
        >
          Save
        </button>
        <p className="text-muted text-sm" role="status">
          {pending ? 'Saving…' : status}
        </p>
      </div>
    </>
  );
}
