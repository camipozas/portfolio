'use client';

import {
  ArrowDownWideNarrow,
  ArrowLeft,
  Captions,
  Check,
  Eye,
  EyeOff,
  Maximize2,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { saveAlbumPhotos } from '@/app/admin/actions';
import { move } from '@/lib/backoffice/curation';
import type { Localized } from '@/lib/pictures/types';
import { cn } from '@/lib/utils';
import { PhotoReview } from './photo-review';
import { PublishBar } from './publish-bar';
import { useAutosave } from './use-autosave';

export interface PhotoTile {
  id: string;
  visible: boolean;
  thumbUrl: string;
  largeUrl: string;
  takenAt?: string;
  caption?: Localized;
}

interface PhotosEditorProps {
  albumKey: string;
  albumTitle: string;
  initialCoverId?: string;
  initial: PhotoTile[];
  initialPending: boolean;
  publishedAt?: string;
}

type Filter = 'all' | 'shown' | 'hidden';

export function PhotosEditor(props: PhotosEditorProps) {
  const [album, setAlbum] = useState({
    photos: props.initial,
    coverId: props.initialCoverId,
  });
  const [pending, setPending] = useState(props.initialPending);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [dragged, setDragged] = useState<number | null>(null);
  const [review, setReview] = useState<number | null>(null);

  const saveStatus = useAutosave(
    album,
    (value) =>
      saveAlbumPhotos(
        props.albumKey,
        value.photos.map(({ id, visible, caption }) => ({
          id,
          visible,
          caption,
        })),
        value.coverId
      ),
    () => setPending(true)
  );

  const { photos, coverId } = album;
  const shownCount = photos.filter((p) => p.visible).length;
  const view = photos.filter(
    (p) => filter === 'all' || (filter === 'shown' ? p.visible : !p.visible)
  );
  const setPhotos = (change: (list: PhotoTile[]) => PhotoTile[]) =>
    setAlbum((a) => ({ ...a, photos: change(a.photos) }));
  const setVisible = (ids: Set<string>, visible: boolean) =>
    setPhotos((list) =>
      list.map((p) => (ids.has(p.id) ? { ...p, visible } : p))
    );

  // One state per photo: on the site or not. Shift+click applies it to the range.
  const toggle = (index: number, range: boolean) => {
    const visible = !view[index].visible;
    const ids =
      range && anchor !== null
        ? view.slice(Math.min(anchor, index), Math.max(anchor, index) + 1)
        : [view[index]];
    setVisible(new Set(ids.map((p) => p.id)), visible);
    setAnchor(index);
  };
  const hiddenInView = view.filter((p) => !p.visible);
  const shownInView = view.filter((p) => p.visible);

  const filters: [Filter, string, number][] = [
    ['all', 'Todas', photos.length],
    ['shown', 'Visibles', shownCount],
    ['hidden', 'Ocultas', photos.length - shownCount],
  ];

  return (
    <>
      <PublishBar
        onPublished={() => setPending(false)}
        pending={pending}
        publishedAt={props.publishedAt}
        saveStatus={saveStatus}
        title={
          <div className="flex items-center gap-3">
            <a
              aria-label="Volver a los álbumes"
              className="text-muted hover:bg-border rounded-full p-2"
              href="/admin"
            >
              <ArrowLeft size={16} />
            </a>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">
                {props.albumTitle}
              </h1>
              <p className="text-muted text-xs">
                {shownCount} de {photos.length} fotos visibles
              </p>
            </div>
          </div>
        }
      />

      <div className="border-border bg-background/90 sticky top-[65px] z-10 -mx-6 mb-4 flex flex-wrap items-center gap-2 border-b px-6 py-2 text-sm backdrop-blur">
        <fieldset className="border-border flex rounded-full border p-0.5">
          <legend className="sr-only">Filtrar</legend>
          {filters.map(([value, label, count]) => (
            <button
              aria-pressed={filter === value}
              className={cn(
                'rounded-full px-3 py-1',
                filter === value && 'bg-foreground text-background'
              )}
              key={value}
              onClick={() => {
                setFilter(value);
                setAnchor(null);
              }}
              type="button"
            >
              {label} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </fieldset>
        <span className="bg-border mx-1 h-5 w-px" />
        <button
          className="bg-accent flex items-center gap-1 rounded-full px-3 py-1 text-white disabled:opacity-40"
          disabled={hiddenInView.length === 0}
          onClick={() =>
            setVisible(new Set(hiddenInView.map((p) => p.id)), true)
          }
          type="button"
        >
          <Eye size={14} /> Mostrar {hiddenInView.length}
        </button>
        <button
          className="bg-foreground text-background flex items-center gap-1 rounded-full px-3 py-1 disabled:opacity-40"
          disabled={shownInView.length === 0}
          onClick={() =>
            setVisible(new Set(shownInView.map((p) => p.id)), false)
          }
          type="button"
        >
          <EyeOff size={14} /> Ocultar {shownInView.length}
        </button>
        <button
          className="text-muted hover:bg-border ml-auto flex items-center gap-1 rounded-full px-2 py-1"
          onClick={() =>
            setPhotos((list) =>
              [...list].sort((a, b) =>
                (a.takenAt ?? '').localeCompare(b.takenAt ?? '')
              )
            )
          }
          type="button"
        >
          <ArrowDownWideNarrow size={14} /> Ordenar por fecha
        </button>
      </div>

      <p className="text-muted mb-3 text-xs">
        Clic en una foto para mostrarla u ocultarla en el sitio (Shift+clic para
        un rango). Las de color con ✓ se ven; las apagadas no. La estrella la
        deja de portada, la lupa la abre en grande, donde también se le pone
        título (las que tienen uno muestran{' '}
        <Captions
          aria-hidden="true"
          className="inline align-text-bottom"
          size={14}
        />
        ). Arrastra para cambiar el orden.
      </p>

      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {view.map((photo, i) => {
          const index = photos.indexOf(photo);
          const caption = photo.caption?.en.trim() || photo.caption?.es?.trim();
          return (
            <li
              className="relative"
              draggable={filter === 'all'}
              key={photo.id}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', photo.id);
                setDragged(index);
              }}
              onDrop={() =>
                dragged !== null &&
                setPhotos((list) => move(list, dragged, index))
              }
            >
              <button
                aria-label={`Foto ${index + 1}: ${photo.visible ? 'visible en el sitio' : 'oculta'}${caption ? `, título: ${caption}` : ''}`}
                aria-pressed={photo.visible}
                className={cn(
                  'ring-offset-background block w-full overflow-hidden rounded-lg ring-offset-2 transition',
                  photo.visible
                    ? 'ring-accent ring-2'
                    : 'hover:ring-border hover:ring-2'
                )}
                onClick={(event) => toggle(i, event.shiftKey)}
                title={
                  photo.visible ? 'Clic para ocultar' : 'Clic para mostrar'
                }
                type="button"
              >
                {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
                <img
                  alt=""
                  className={cn(
                    'aspect-square w-full object-cover transition',
                    !photo.visible && 'opacity-35 grayscale'
                  )}
                  loading="lazy"
                  src={photo.thumbUrl}
                />
              </button>
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full border-2 border-white shadow',
                  photo.visible ? 'bg-accent text-white' : 'bg-black/30'
                )}
              >
                {photo.visible ? <Check size={14} strokeWidth={3} /> : null}
              </span>
              {caption ? (
                <span className="pointer-events-none absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white shadow">
                  <Captions aria-hidden="true" size={14} />
                </span>
              ) : null}
              <button
                aria-label={`Usar foto ${index + 1} como portada`}
                aria-pressed={coverId === photo.id}
                className={cn(
                  'absolute bottom-1 left-1 rounded-full p-1.5 shadow',
                  coverId === photo.id
                    ? 'bg-amber-400 text-black'
                    : 'bg-black/60 text-white'
                )}
                onClick={() => setAlbum((a) => ({ ...a, coverId: photo.id }))}
                type="button"
              >
                <Star
                  fill={coverId === photo.id ? 'currentColor' : 'none'}
                  size={14}
                />
              </button>
              <button
                aria-label={`Ver foto ${index + 1} en grande`}
                className="absolute right-1 bottom-1 rounded-full bg-black/60 p-1.5 text-white shadow"
                onClick={() => setReview(index)}
                type="button"
              >
                <Maximize2 size={14} />
              </button>
            </li>
          );
        })}
      </ol>
      {review === null ? null : (
        <PhotoReview
          coverId={coverId}
          index={review}
          onCaption={(id, caption) =>
            setPhotos((list) =>
              list.map((p) => (p.id === id ? { ...p, caption } : p))
            )
          }
          onClose={() => setReview(null)}
          onCover={(id) => setAlbum((a) => ({ ...a, coverId: id }))}
          onIndex={setReview}
          onToggle={(id) =>
            setPhotos((list) =>
              list.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
            )
          }
          photos={photos}
        />
      )}
    </>
  );
}
