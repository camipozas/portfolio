'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createCollection } from '@/app/admin/actions';
import type { AlbumState } from '@/lib/backoffice/curation';
import { move } from '@/lib/backoffice/curation';
import type { Collection, Localized } from '@/lib/pictures/types';

interface CollectionsPanelProps {
  collections: Collection[];
  albums: Pick<AlbumState, 'slug' | 'title' | 'collection'>[];
  canCreate: boolean;
  onChange: (collections: Collection[]) => void;
  onCreated: (collection: Collection) => void;
  onDelete: (slug: string) => void;
}

const input =
  'border-border bg-background min-w-0 rounded-md border px-2 py-1.5 text-sm';

export function CollectionsPanel({
  collections,
  albums: allAlbums,
  canCreate,
  onChange,
  onCreated,
  onDelete,
}: CollectionsPanelProps) {
  const [draft, setDraft] = useState<Localized>({ en: '' });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [creating, startCreating] = useTransition();

  const edit = (slug: string, patch: Partial<Collection>) =>
    onChange(
      collections.map((c) => (c.slug === slug ? { ...c, ...patch } : c))
    );
  const setDescription = (
    collection: Collection,
    patch: Partial<Localized>
  ) => {
    const description = { en: '', ...collection.description, ...patch };
    edit(collection.slug, {
      description: description.en || description.es ? description : undefined,
    });
  };

  const create = () =>
    startCreating(async () => {
      try {
        onCreated(await createCollection(draft));
        setDraft({ en: '' });
        setError('');
      } catch {
        setError('No se pudo crear la colección, reintenta');
      }
    });

  return (
    <section
      aria-labelledby="collections-heading"
      className="border-border mb-8 rounded-xl border p-4"
    >
      <h2 className="font-medium" id="collections-heading">
        Colecciones
      </h2>
      <p className="text-muted mb-4 text-xs">
        Agrupan los álbumes en el sitio (por ejemplo Viajes o Perros). Solo se
        ven las que tienen algún álbum publicado. La portada es el álbum cuya
        foto de portada encabeza el mosaico.
      </p>
      {collections.length > 0 && (
        <ol className="mb-4 grid gap-4">
          {collections.map((collection, i) => {
            const members = allAlbums.filter(
              (a) => a.collection === collection.slug
            );
            const albums = members.length;
            return (
              <li
                className="flex flex-wrap items-center gap-2"
                key={collection.slug}
              >
                <input
                  aria-label="Título en inglés"
                  className={input}
                  onChange={(e) =>
                    edit(collection.slug, {
                      title: { ...collection.title, en: e.target.value },
                    })
                  }
                  value={collection.title.en}
                />
                <input
                  aria-label="Título en español"
                  className={input}
                  onChange={(e) =>
                    edit(collection.slug, {
                      title: {
                        ...collection.title,
                        es: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="En español (opcional)"
                  value={collection.title.es ?? ''}
                />
                <span className="text-muted text-xs">
                  {albums === 1 ? '1 álbum' : `${albums} álbumes`}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    aria-label={`Subir ${collection.title.en}`}
                    className="text-muted hover:bg-border rounded-full p-1.5 disabled:opacity-30"
                    disabled={i === 0}
                    onClick={() => onChange(move(collections, i, i - 1))}
                    type="button"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label={`Bajar ${collection.title.en}`}
                    className="text-muted hover:bg-border rounded-full p-1.5 disabled:opacity-30"
                    disabled={i === collections.length - 1}
                    onClick={() => onChange(move(collections, i, i + 1))}
                    type="button"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    aria-label={`Eliminar ${collection.title.en}`}
                    className="text-muted rounded-full p-1.5 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => setConfirming(collection.slug)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
                <div className="grid w-full gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <textarea
                    aria-label={`Descripción de ${collection.title.en} en inglés`}
                    className={input}
                    maxLength={160}
                    onChange={(e) =>
                      setDescription(collection, { en: e.target.value })
                    }
                    placeholder="Descripción (opcional), ej. European cities, 2023–2025"
                    rows={2}
                    value={collection.description?.en ?? ''}
                  />
                  <textarea
                    aria-label={`Descripción de ${collection.title.en} en español`}
                    className={input}
                    maxLength={160}
                    onChange={(e) =>
                      setDescription(collection, {
                        es: e.target.value || undefined,
                      })
                    }
                    placeholder="En español, ej. Ciudades de Europa, 2023–2025"
                    rows={2}
                    value={collection.description?.es ?? ''}
                  />
                  <label className="flex items-center gap-2 text-sm sm:flex-col sm:items-start sm:gap-1">
                    Portada
                    <select
                      className={input}
                      disabled={albums === 0}
                      onChange={(e) =>
                        edit(collection.slug, {
                          coverAlbum: e.target.value || undefined,
                        })
                      }
                      value={collection.coverAlbum ?? ''}
                    >
                      <option value="">
                        {members[0]
                          ? `Primer álbum (${members[0].title.es || members[0].title.en})`
                          : 'Sin álbumes'}
                      </option>
                      {members.map((a) => (
                        <option key={a.slug} value={a.slug}>
                          {a.title.es || a.title.en}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {confirming === collection.slug && (
                  <div
                    className="flex w-full flex-wrap items-center gap-2 rounded-md bg-red-500/10 px-3 py-2 text-sm"
                    role="alert"
                  >
                    <span className="mr-auto">
                      ¿Eliminar «{collection.title.es || collection.title.en}»?
                      {albums > 0 && ' Sus álbumes quedarán sin colección.'}
                    </span>
                    <button
                      className="rounded-full bg-red-600 px-3 py-1 text-white"
                      onClick={() => {
                        setConfirming(null);
                        onDelete(collection.slug);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                    <button
                      className="hover:bg-border rounded-full px-3 py-1"
                      onClick={() => setConfirming(null)}
                      type="button"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          create();
        }}
      >
        <input
          aria-label="Nueva colección, título en inglés"
          className={input}
          onChange={(e) => setDraft({ ...draft, en: e.target.value })}
          placeholder="Nueva colección (inglés)"
          required
          value={draft.en}
        />
        <input
          aria-label="Nueva colección, título en español"
          className={input}
          onChange={(e) =>
            setDraft({ ...draft, es: e.target.value || undefined })
          }
          placeholder="En español (opcional)"
          value={draft.es ?? ''}
        />
        <button
          className="bg-foreground text-background flex items-center gap-1 rounded-full px-3 py-1.5 text-sm disabled:opacity-40"
          disabled={!(canCreate && draft.en.trim()) || creating}
          type="submit"
        >
          <Plus size={14} />
          Crear
        </button>
        {error !== '' && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
