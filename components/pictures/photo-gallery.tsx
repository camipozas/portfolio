'use client';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/locale';
import {
  formatCamera,
  formatSettings,
  formatTakenAt,
} from '@/lib/pictures/exif';
import { aboveWatermark, localized, photoUrl } from '@/lib/pictures/manifest';
import type { Photo } from '@/lib/pictures/types';

interface PhotoGalleryProps {
  photos: Photo[];
  albumTitle: string;
  lang: Locale;
  labels: {
    close: string;
    previous: string;
    next: string;
    openFullSize: string;
    details: string;
  };
}

const SWIPE_PX = 50;
// Row heights of the justified grid (keep in sync with --row below). Tiles grow up to
// ~1.6x their base width to fill a row, so `sizes` asks for that much.
const ROW_PX = { phone: 104 * 1.6, wide: 176 * 1.6 };
const EAGER = 6;

// Images that finished loading before hydration never fire onLoad.
const revealWhenLoaded = (img: HTMLImageElement | null) => {
  if (img?.complete) {
    img.dataset.loaded = '';
  }
};
const reveal = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.dataset.loaded = '';
};

export function PhotoGallery({
  photos,
  albumTitle,
  lang,
  labels,
}: PhotoGalleryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const pushed = useRef(false);
  const current = index === null ? undefined : photos[index];

  const altOf = (photo: Photo, i: number) =>
    localized(photo.alt, lang) || `${albumTitle} ${i + 1}/${photos.length}`;
  // Each photo has its own URL. The URL is the source of truth: back/forward and
  // shared links open or close the viewer, and every way of closing it lands in onClose.
  const show = (i: number) => {
    setIndex(i);
    if (!dialog.current?.open) {
      dialog.current?.showModal();
    }
  };
  const open = (i: number) => {
    show(i);
    window.history.pushState({ viewer: true }, '', `?photo=${photos[i].id}`);
    pushed.current = true;
  };
  const close = () => dialog.current?.close();
  const onClose = () => {
    setIndex(null);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };
  const step = (delta: number) => {
    if (index === null) {
      return;
    }
    const next = (index + delta + photos.length) % photos.length;
    setIndex(next);
    window.history.replaceState(
      window.history.state,
      '',
      `?photo=${photos[next].id}`
    );
  };

  useEffect(() => {
    const syncWithUrl = () => {
      const id = new URLSearchParams(window.location.search).get('photo');
      const at = photos.findIndex((photo) => photo.id === id);
      if (at >= 0) {
        setIndex(at);
        if (!dialog.current?.open) {
          dialog.current?.showModal();
        }
        return;
      }
      pushed.current = false;
      dialog.current?.close();
    };
    syncWithUrl();
    window.addEventListener('popstate', syncWithUrl);
    return () => window.removeEventListener('popstate', syncWithUrl);
  }, [photos]);

  useEffect(() => {
    if (index === null) {
      return;
    }
    for (const near of [index - 1, index + 1]) {
      const photo = photos[(near + photos.length) % photos.length];
      new Image().src = photoUrl(photo.id, '2048');
    }
  }, [index, photos]);

  return (
    <>
      <ul className="flex flex-wrap gap-1.5 [--row:6.5rem] after:grow-[999] after:content-[''] sm:gap-2 sm:[--row:11rem]">
        {photos.map((photo, i) => {
          const ratio = photo.width / (photo.height * aboveWatermark(photo));
          return (
            <li
              key={photo.id}
              style={{
                flexGrow: ratio,
                flexBasis: `calc(var(--row) * ${ratio})`,
              }}
            >
              <button
                className="group bg-border focus-visible:outline-accent relative block w-full cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => open(i)}
                style={{
                  aspectRatio: `${ratio}`,
                  backgroundColor: photo.color,
                }}
                type="button"
              >
                {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
                <img
                  alt={altOf(photo, i)}
                  className="absolute inset-0 size-full object-cover object-top opacity-0 data-loaded:opacity-100 motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                  decoding="async"
                  height={photo.height}
                  loading={i < EAGER ? 'eager' : 'lazy'}
                  onLoad={reveal}
                  ref={revealWhenLoaded}
                  sizes={`(min-width: 640px) ${Math.round(ROW_PX.wide * ratio)}px, ${Math.round(ROW_PX.phone * ratio)}px`}
                  src={photoUrl(photo.id, 'thumb')}
                  srcSet={`${photoUrl(photo.id, 'thumb')} 600w, ${photoUrl(photo.id, '1200')} 1200w`}
                  width={photo.width}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <dialog
        aria-label={albumTitle}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black"
        onClose={onClose}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            step(-1);
          }
          if (event.key === 'ArrowRight') {
            step(1);
          }
        }}
        onTouchEnd={(event) => {
          const start = touchX.current;
          const dx = event.changedTouches[0].clientX - (start ?? 0);
          if (start !== null && Math.abs(dx) > SWIPE_PX) {
            step(dx < 0 ? 1 : -1);
          }
          touchX.current = null;
        }}
        onTouchStart={(event) => {
          touchX.current = event.touches[0].clientX;
        }}
        ref={dialog}
      >
        {current && index !== null && (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-3 px-3 py-2 text-sm">
              <button
                aria-label={`${labels.close}: ${albumTitle}`}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/10"
                onClick={close}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
                <span className="max-w-48 truncate">{albumTitle}</span>
              </button>
              <span
                aria-live="polite"
                className="ml-auto text-white/60 tabular-nums"
              >
                {index + 1} / {photos.length}
              </span>
              {current.exif ? (
                <button
                  aria-label={labels.details}
                  aria-pressed={showInfo}
                  className="rounded-full p-2 hover:bg-white/10 aria-pressed:bg-white/15"
                  onClick={() => setShowInfo((on) => !on)}
                  title={labels.details}
                  type="button"
                >
                  <Info aria-hidden="true" size={18} />
                </button>
              ) : null}
              <a
                className="flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-white/10"
                href={photoUrl(current.id, 'full')}
                rel="noopener"
                target="_blank"
              >
                <Download aria-hidden="true" size={16} />
                <span className="sr-only sm:not-sr-only">
                  {labels.openFullSize}
                </span>
              </a>
            </header>

            <figure className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-2 pb-4">
              <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                {/* The thumbnail is already cached: show it blurred while the sharp one loads. */}
                {/* biome-ignore lint/performance/noImgElement: pre-sized on S3 */}
                <img
                  alt=""
                  aria-hidden="true"
                  className="absolute max-h-full max-w-full object-contain blur-md"
                  height={current.height}
                  key={`thumb-${current.id}`}
                  src={photoUrl(current.id, 'thumb')}
                  width={current.width}
                />
                {/* biome-ignore lint/performance/noImgElement: pre-sized on S3 */}
                <img
                  alt={altOf(current, index)}
                  className="relative max-h-full max-w-full object-contain opacity-0 data-loaded:opacity-100 motion-safe:transition-opacity motion-safe:duration-300"
                  height={current.height}
                  key={current.id}
                  onLoad={reveal}
                  ref={revealWhenLoaded}
                  src={photoUrl(current.id, '2048')}
                  width={current.width}
                />
              </div>
              {showInfo && current.exif ? (
                <figcaption className="text-center text-xs text-white/60">
                  <p>
                    {[formatCamera(current.exif), current.exif.lens]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p>
                    {[
                      formatSettings(current.exif),
                      current.exif.takenAt &&
                        formatTakenAt(current.exif.takenAt, lang),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </figcaption>
              ) : null}
              <button
                aria-label={labels.previous}
                className="absolute top-1/2 left-2 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 sm:block"
                onClick={() => step(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={24} />
              </button>
              <button
                aria-label={labels.next}
                className="absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 sm:block"
                onClick={() => step(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={24} />
              </button>
            </figure>
          </div>
        )}
      </dialog>
    </>
  );
}
