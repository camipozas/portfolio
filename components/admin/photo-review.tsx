'use client';

import { ChevronLeft, ChevronRight, Eye, EyeOff, Star, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { CAPTION_MAX } from '@/lib/backoffice/curation';
import type { Localized } from '@/lib/pictures/types';
import { cn } from '@/lib/utils';
import type { PhotoTile } from './photos-editor';

interface PhotoReviewProps {
  photos: PhotoTile[];
  index: number;
  coverId?: string;
  onIndex: (index: number) => void;
  onToggle: (id: string) => void;
  onCover: (id: string) => void;
  onCaption: (id: string, caption: Localized) => void;
  onClose: () => void;
}

/** One photo large, to decide shown/hidden and the cover without leaving. */
export function PhotoReview({
  photos,
  index,
  coverId,
  onIndex,
  onToggle,
  onCover,
  onCaption,
  onClose,
}: PhotoReviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = photos[index];
  const go = (delta: number) =>
    onIndex((index + delta + photos.length) % photos.length);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  if (!photo) {
    return null;
  }

  return (
    <dialog
      aria-label="Revisar fotos"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white outline-none backdrop:bg-black"
      onClose={onClose}
      onKeyDown={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.altKey ||
          event.target instanceof HTMLInputElement
        ) {
          return;
        }
        switch (event.key.toLowerCase()) {
          case 'arrowleft':
            go(-1);
            break;
          case 'arrowright':
            go(1);
            break;
          case 'v':
            onToggle(photo.id);
            break;
          case 'p':
            onCover(photo.id);
            break;
          default:
        }
      }}
      ref={dialog}
      // Clicking the photo after typing focuses the dialog, so the shortcuts work again.
      tabIndex={-1}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 px-4 py-3 text-sm">
          <span className="text-white/60 tabular-nums">
            {index + 1} / {photos.length}
          </span>
          <span className="ml-3 hidden text-white/40 sm:inline">
            ← → navegar · V mostrar/ocultar · P portada · Esc cerrar
          </span>
          <button
            className={cn(
              'ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5',
              photo.visible ? 'bg-accent' : 'bg-white/15'
            )}
            onClick={() => onToggle(photo.id)}
            type="button"
          >
            {photo.visible ? <Eye size={16} /> : <EyeOff size={16} />}
            {photo.visible ? 'Visible' : 'Oculta'}
          </button>
          <button
            aria-pressed={coverId === photo.id}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5',
              coverId === photo.id ? 'bg-amber-400 text-black' : 'bg-white/15'
            )}
            onClick={() => onCover(photo.id)}
            type="button"
          >
            <Star
              fill={coverId === photo.id ? 'currentColor' : 'none'}
              size={16}
            />
            Portada
          </button>
          <button
            aria-label="Cerrar"
            className="rounded-full p-2 hover:bg-white/10"
            onClick={() => dialog.current?.close()}
            type="button"
          >
            <X size={18} />
          </button>
        </header>
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-2">
          {/* biome-ignore lint/performance/noImgElement: short-lived presigned S3 URL */}
          <img
            alt=""
            className={cn(
              'max-h-full max-w-full object-contain transition',
              !photo.visible && 'opacity-40 grayscale'
            )}
            key={photo.id}
            src={photo.largeUrl}
          />
          <button
            aria-label="Foto anterior"
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15"
            onClick={() => go(-1)}
            type="button"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            aria-label="Foto siguiente"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15"
            onClick={() => go(1)}
            type="button"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="grid gap-3 px-4 pt-1 pb-4 text-sm sm:grid-cols-2">
          {(
            [
              ['en', 'Título en inglés', 'Old town at dusk'],
              [
                'es',
                'Título en español (opcional)',
                'Casco antiguo al atardecer',
              ],
            ] as const
          ).map(([lang, label, placeholder]) => {
            const text = photo.caption?.[lang] ?? '';
            return (
              <label className="grid gap-1" key={lang}>
                <span className="flex justify-between text-white/60">
                  {label}
                  <span
                    aria-hidden="true"
                    className="text-white/40 tabular-nums"
                  >
                    {text.length}/{CAPTION_MAX}
                  </span>
                </span>
                <input
                  className="rounded-lg bg-white/10 px-3 py-2 placeholder:text-white/30 focus:bg-white/15 focus:outline-2 focus:outline-white/60"
                  lang={lang}
                  maxLength={CAPTION_MAX}
                  onChange={(event) =>
                    onCaption(photo.id, {
                      en: photo.caption?.en ?? '',
                      es: photo.caption?.es,
                      [lang]: event.target.value,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      dialog.current?.focus();
                    }
                  }}
                  placeholder={placeholder}
                  value={text}
                />
              </label>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
