'use client';

import {
  ArrowDownWideNarrow,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { saveAlbumPhotos } from '@/app/admin/actions';
import { move } from '@/lib/backoffice/curation';
import { cn } from '@/lib/utils';
import { PublishBar } from './publish-bar';
import { useAutosave } from './use-autosave';

export interface PhotoTile {
  id: string;
  visible: boolean;
  thumbUrl: string;
  takenAt?: string;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [dragged, setDragged] = useState<number | null>(null);

  const saveStatus = useAutosave(
    album,
    (value) =>
      saveAlbumPhotos(
        props.albumKey,
        value.photos.map(({ id, visible }) => ({ id, visible })),
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

  const select = (index: number, range: boolean) => {
    const ids =
      range && anchor !== null
        ? view
            .slice(Math.min(anchor, index), Math.max(anchor, index) + 1)
            .map((p) => p.id)
        : [view[index].id];
    setSelected((current) => {
      const next = new Set(current);
      const on = range || !current.has(view[index].id);
      for (const id of ids) {
        if (on) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
    setAnchor(index);
  };

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
              onClick={() => setFilter(value)}
              type="button"
            >
              {label} <span className="opacity-60">{count}</span>
            </button>
          ))}
        </fieldset>
        <span className="bg-border mx-1 h-5 w-px" />
        <button
          className="hover:bg-border rounded-full px-2 py-1"
          onClick={() => setSelected(new Set(view.map((p) => p.id)))}
          type="button"
        >
          Seleccionar todas
        </button>
        <button
          className="hover:bg-border rounded-full px-2 py-1"
          onClick={() => setSelected(new Set())}
          type="button"
        >
          Ninguna
        </button>
        <button
          className="hover:bg-border rounded-full px-2 py-1"
          onClick={() =>
            setSelected(
              new Set(view.filter((p) => !selected.has(p.id)).map((p) => p.id))
            )
          }
          type="button"
        >
          Invertir
        </button>
        {selected.size > 0 && (
          <div className="bg-accent/10 flex items-center gap-2 rounded-full py-0.5 pr-0.5 pl-3">
            <span className="font-medium">{selected.size} seleccionadas</span>
            <button
              className="bg-accent flex items-center gap-1 rounded-full px-3 py-1 text-white"
              onClick={() => setVisible(selected, true)}
              type="button"
            >
              <Eye size={14} /> Mostrar
            </button>
            <button
              className="bg-foreground text-background flex items-center gap-1 rounded-full px-3 py-1"
              onClick={() => setVisible(selected, false)}
              type="button"
            >
              <EyeOff size={14} /> Ocultar
            </button>
          </div>
        )}
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
        Clic en una foto para seleccionarla, Shift+clic para un rango. El ojo la
        muestra u oculta, la estrella la deja de portada. Arrastra para cambiar
        el orden.
      </p>

      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {view.map((photo, i) => {
          const isSelected = selected.has(photo.id);
          const index = photos.indexOf(photo);
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
                aria-label={`Foto ${index + 1}${photo.visible ? '' : ', oculta'}${isSelected ? ', seleccionada' : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  'ring-offset-background block w-full overflow-hidden rounded-lg ring-offset-2 transition',
                  isSelected
                    ? 'ring-accent ring-3'
                    : 'hover:ring-border hover:ring-2'
                )}
                onClick={(event) => select(i, event.shiftKey)}
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
                  'pointer-events-none absolute top-1.5 left-1.5 size-5 rounded-full border-2 border-white shadow',
                  isSelected ? 'bg-accent' : 'bg-black/30'
                )}
              />
              <button
                aria-label={
                  photo.visible
                    ? `Ocultar foto ${index + 1}`
                    : `Mostrar foto ${index + 1}`
                }
                className={cn(
                  'absolute top-1 right-1 rounded-full p-1.5 shadow',
                  photo.visible
                    ? 'bg-accent text-white'
                    : 'bg-black/60 text-white'
                )}
                onClick={() => setVisible(new Set([photo.id]), !photo.visible)}
                type="button"
              >
                {photo.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
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
            </li>
          );
        })}
      </ol>
    </>
  );
}
