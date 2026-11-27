'use client';

import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  GripVertical,
  ImageOff,
  Images,
} from 'lucide-react';
import { useState } from 'react';
import { saveAlbums } from '@/app/admin/actions';
import type { AlbumState, AlbumStatus } from '@/lib/backoffice/curation';
import { move } from '@/lib/backoffice/curation';
import type { Collection } from '@/lib/pictures/types';
import { cn } from '@/lib/utils';
import { CollectionsPanel } from './collections-panel';
import { PublishBar } from './publish-bar';
import { useAutosave } from './use-autosave';

export type AlbumCard = Pick<
  AlbumState,
  'key' | 'slug' | 'title' | 'visible' | 'collection'
> & {
  status: AlbumStatus;
  total: number;
  shown: number;
  coverUrl?: string;
};

const STATUS: Record<AlbumStatus, { label: string; className: string }> = {
  published: { label: 'Publicado', className: 'bg-emerald-500 text-white' },
  changed: {
    label: 'Cambios sin publicar',
    className: 'bg-amber-400 text-black',
  },
  new: { label: 'Nuevo, sin publicar', className: 'bg-accent text-white' },
  hidden: { label: 'Oculto', className: 'bg-black/70 text-white' },
};

function editedStatus(
  album: AlbumCard,
  patch: Partial<AlbumCard>
): AlbumStatus {
  const visible = patch.visible ?? album.visible;
  if (album.status === 'published' || album.status === 'changed') {
    return 'changed';
  }
  return visible && album.shown > 0 ? 'new' : 'hidden';
}

interface AlbumsEditorProps {
  initial: AlbumCard[];
  initialCollections: Collection[];
  initialPending: boolean;
  publishedAt?: string;
}

export function AlbumsEditor({
  initial,
  initialCollections,
  initialPending,
  publishedAt,
}: AlbumsEditorProps) {
  const [albums, setAlbums] = useState(initial);
  const [collections, setCollections] = useState(initialCollections);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [pending, setPending] = useState(initialPending);
  const [open, setOpen] = useState<string | null>(null);
  const [dragged, setDragged] = useState<number | null>(null);

  const saveStatus = useAutosave(
    { albums, collections, deleted },
    (edits) =>
      saveAlbums(
        edits.albums.map(({ key, title, visible, collection }) => ({
          key,
          title,
          visible,
          collection,
        })),
        edits.collections,
        edits.deleted
      ),
    () => setPending(true)
  );
  const update = (key: string, patch: Partial<AlbumCard>) =>
    setAlbums((list) =>
      list.map((album) =>
        album.key === key
          ? { ...album, ...patch, status: editedStatus(album, patch) }
          : album
      )
    );

  const live = albums.filter((album) => album.visible && album.shown > 0);

  return (
    <>
      <PublishBar
        onPublished={() => {
          setPending(false);
          setAlbums((list) =>
            list.map((album) => ({
              ...album,
              status: album.visible && album.shown > 0 ? 'published' : 'hidden',
            }))
          );
        }}
        pending={pending}
        publishedAt={publishedAt}
        saveStatus={saveStatus}
        title={<h1 className="text-lg font-semibold">Álbumes</h1>}
      />
      <p className="text-muted mb-6 text-sm">
        {live.length} de {albums.length} álbumes se verán en el sitio ·{' '}
        {live.reduce((n, album) => n + album.shown, 0)} fotos. Los cambios se
        guardan solos; aparecen en camipg.com/pictures al publicar.
      </p>
      <CollectionsPanel
        albums={albums}
        canCreate={saveStatus !== 'saving'}
        collections={collections}
        onChange={setCollections}
        onCreated={(collection) => {
          setCollections((list) => [...list, collection]);
          setDeleted((list) => list.filter((s) => s !== collection.slug));
        }}
        onDelete={(slug) => {
          setCollections((list) => list.filter((c) => c.slug !== slug));
          setDeleted((list) => [...list, slug]);
          for (const album of albums) {
            if (album.collection === slug) {
              update(album.key, { collection: undefined });
            }
          }
        }}
      />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album, i) => {
          const empty = album.visible && album.shown === 0;
          return (
            <li
              className="border-border bg-background overflow-hidden rounded-xl border shadow-sm"
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
              <a
                className="relative block"
                href={`/admin/albums/${album.slug}`}
              >
                {album.coverUrl ? (
                  // biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL
                  <img
                    alt=""
                    className={cn(
                      'aspect-[4/3] w-full object-cover',
                      !album.visible && 'opacity-40 grayscale'
                    )}
                    src={album.coverUrl}
                  />
                ) : (
                  <div className="bg-border text-muted flex aspect-[4/3] items-center justify-center">
                    <ImageOff />
                  </div>
                )}
                <span
                  className={cn(
                    'absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium',
                    STATUS[album.status].className
                  )}
                >
                  {STATUS[album.status].label}
                </span>
                <GripVertical
                  aria-hidden="true"
                  className="absolute top-2 right-2 text-white drop-shadow"
                  size={18}
                />
              </a>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <h2 className="font-medium">
                    {album.title.es || album.title.en}
                  </h2>
                  <p
                    className={cn(
                      'text-xs',
                      empty ? 'text-amber-600' : 'text-muted'
                    )}
                  >
                    {empty
                      ? 'Sin fotos visibles: no aparecerá en el sitio'
                      : `${album.shown} de ${album.total} fotos visibles`}
                  </p>
                </div>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  Visible en el sitio
                  <button
                    aria-checked={album.visible}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      album.visible ? 'bg-accent' : 'bg-border'
                    )}
                    onClick={() =>
                      update(album.key, { visible: !album.visible })
                    }
                    role="switch"
                    type="button"
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0 size-5 rounded-full bg-white shadow transition-transform',
                        album.visible ? 'translate-x-5.5' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </label>
                {collections.length > 0 && (
                  <label className="flex items-center justify-between gap-2 text-sm">
                    Colección
                    <select
                      className="border-border bg-background min-w-0 rounded-md border px-2 py-1"
                      onChange={(e) =>
                        update(album.key, {
                          collection: e.target.value || undefined,
                        })
                      }
                      value={album.collection ?? ''}
                    >
                      <option value="">Sin colección</option>
                      {collections.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.title.es || c.title.en}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="flex items-center gap-1 text-sm">
                  <a
                    className="bg-foreground text-background mr-auto flex items-center gap-1 rounded-full px-3 py-1.5"
                    href={`/admin/albums/${album.slug}`}
                  >
                    <Images size={14} />
                    <span className="text-background">Elegir fotos</span>
                  </a>
                  <button
                    aria-expanded={open === album.key}
                    className="text-muted hover:bg-border flex items-center gap-1 rounded-full px-2 py-1.5"
                    onClick={() =>
                      setOpen(open === album.key ? null : album.key)
                    }
                    type="button"
                  >
                    Títulos <ChevronDown size={14} />
                  </button>
                  <button
                    aria-label={`Mover ${album.title.en} antes`}
                    className="text-muted hover:bg-border rounded-full p-1.5"
                    onClick={() => setAlbums((l) => move(l, i, i - 1))}
                    type="button"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    aria-label={`Mover ${album.title.en} después`}
                    className="text-muted hover:bg-border rounded-full p-1.5"
                    onClick={() => setAlbums((l) => move(l, i, i + 1))}
                    type="button"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
                {open === album.key && (
                  <div className="grid gap-2 text-sm">
                    <label className="grid gap-1">
                      <span className="text-muted text-xs">
                        Título en inglés (obligatorio)
                      </span>
                      <input
                        className="border-border bg-background rounded-md border px-2 py-1.5"
                        onChange={(e) =>
                          update(album.key, {
                            title: { ...album.title, en: e.target.value },
                          })
                        }
                        value={album.title.en}
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-muted text-xs">
                        Título en español (si falta, se usa el inglés)
                      </span>
                      <input
                        className="border-border bg-background rounded-md border px-2 py-1.5"
                        onChange={(e) =>
                          update(album.key, {
                            title: {
                              ...album.title,
                              es: e.target.value || undefined,
                            },
                          })
                        }
                        value={album.title.es ?? ''}
                      />
                    </label>
                    <p className="text-muted text-xs">
                      camipg.com/pictures/{album.slug} · carpeta: {album.key}
                    </p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
