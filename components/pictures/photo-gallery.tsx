'use client';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Share2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '@/lib/locale';
import { justifyRows } from '@/lib/pictures/justify';
import { aboveWatermark, localized, photoUrl } from '@/lib/pictures/manifest';
import type { Photo } from '@/lib/pictures/types';
import type { PhotoInfoLabels } from './photo-info';
import { PhotoInfo } from './photo-info';

interface PhotoGalleryProps {
  photos: Photo[];
  albumTitle: string;
  /** The album's public path; each photo lives at `${basePath}/${id}`. */
  basePath: string;
  lang: Locale;
  labels: {
    close: string;
    previous: string;
    next: string;
    openFullSize: string;
    details: string;
    closeDetails: string;
    share: string;
    linkCopied: string;
    swipeHint: string;
    specs: PhotoInfoLabels['specs'];
  };
}

/** The photo a URL points at: `<album>/<id>`, or the older `?photo=<id>`. */
const photoIdIn = (basePath: string) => {
  const { pathname, search } = window.location;
  return pathname.startsWith(`${basePath}/`)
    ? decodeURIComponent(pathname.slice(basePath.length + 1))
    : new URLSearchParams(search).get('photo');
};

const SWIPE_PX = 50;
const HINT_SEEN = 'pictures:swipe-hint-seen';
const HINT_MS = 3500;
// Storage can be blocked (private mode): then the hint shows every time rather than never.
const hintSeen = () => {
  try {
    return localStorage.getItem(HINT_SEEN) !== null;
  } catch {
    return false;
  }
};
const markHintSeen = () => {
  try {
    localStorage.setItem(HINT_SEEN, '1');
  } catch {
    // Nothing to remember it in.
  }
};
// Row heights of the justified grid (keep in sync with --row below). Tiles grow up to
// ~1.6x their base width to fill a row, so `sizes` asks for that much.
const ROW_PX = { phone: 104 * 1.6, wide: 176 * 1.6 };
const EAGER = 6;
// Target row heights once the grid's width is known (below that, the CSS rows above).
const TARGET_ROW = { phone: 120, wide: 230 };
const SM = 640; // Tailwind's sm, where the CSS rows and gaps switch too.

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
  basePath,
  lang,
  labels,
}: PhotoGalleryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [hint, setHint] = useState(false);
  const infoButton = useRef<HTMLButtonElement>(null);
  // Closing the panel unmounts its close button: keep focus inside the dialog so
  // the arrow keys and "i" keep working.
  const toggleInfo = () => {
    if (showInfo) {
      infoButton.current?.focus();
    }
    setShowInfo(!showInfo);
  };
  const pushed = useRef(false);
  const current = index === null ? undefined : photos[index];
  // Below md the details sheet covers the middle of the photo, arrows included.
  const arrows = showInfo ? 'md:block' : 'sm:block';

  // The viewer prints the caption under the photo, so its alt leaves it out.
  const altOf = (photo: Photo, i: number, withCaption = true) =>
    (withCaption && localized(photo.caption, lang)) ||
    localized(photo.alt, lang) ||
    `${albumTitle} ${i + 1}/${photos.length}`;
  // Each photo has its own URL. The URL is the source of truth: back/forward and
  // shared links open or close the viewer, and every way of closing it lands in onClose.
  const show = (i: number) => {
    setIndex(i);
    if (!dialog.current?.open) {
      dialog.current?.showModal();
    }
  };
  const urlOf = (photo: Photo) => `${basePath}/${photo.id}`;
  const open = (i: number) => {
    show(i);
    window.history.pushState({ viewer: true }, '', urlOf(photos[i]));
    pushed.current = true;
  };
  const close = () => dialog.current?.close();
  const onClose = () => {
    setIndex(null);
    showCopied(false);
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else if (
      window.location.pathname !== basePath ||
      window.location.search
    ) {
      window.history.replaceState(null, '', basePath);
    }
  };
  const step = (delta: number) => {
    if (index === null) {
      return;
    }
    const next = (index + delta + photos.length) % photos.length;
    setIndex(next);
    if (hint) {
      setHint(false);
      markHintSeen();
    }
    // Fresh state, so Next records the new URL instead of restoring the first one later.
    window.history.replaceState(null, '', urlOf(photos[next]));
  };
  const [copied, setCopied] = useState(false);
  const viewerOpen = index !== null;
  // Phones can only swipe between photos, which nothing on screen says: tell them once,
  // and count it as seen only once it has had time to be read (or they swiped).
  const swipeable = photos.length > 1;
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (!(viewerOpen && swipeable && coarse) || hintSeen()) {
      return;
    }
    setHint(true);
    const timer = setTimeout(() => {
      setHint(false);
      markHintSeen();
    }, HINT_MS);
    return () => {
      clearTimeout(timer);
      setHint(false);
    };
  }, [viewerOpen, swipeable]);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showCopied = (on: boolean) => {
    clearTimeout(copiedTimer.current);
    setCopied(on);
    if (on) {
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    }
  };
  useEffect(() => () => clearTimeout(copiedTimer.current), []);
  // Touch screens get the system share sheet; elsewhere, or if it fails, copy the link.
  const share = async (photo: Photo) => {
    const url = new URL(urlOf(photo), window.location.origin).href;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: albumTitle, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showCopied(true);
    } catch {
      // No clipboard access (insecure page, embedded browser): the URL bar has the link.
    }
  };

  useEffect(() => {
    const syncWithUrl = () => {
      const id = photoIdIn(basePath);
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
  }, [photos, basePath]);

  useEffect(() => {
    if (index === null) {
      return;
    }
    for (const near of [index - 1, index + 1]) {
      const photo = photos[(near + photos.length) % photos.length];
      new Image().src = photoUrl(photo.id, '2048');
    }
  }, [index, photos]);

  const grid = useRef<HTMLUListElement>(null);
  const [gridSize, setGridSize] = useState({ width: 0, gap: 0 });
  useEffect(() => {
    const list = grid.current;
    if (!list) {
      return;
    }
    const observer = new ResizeObserver(([entry]) =>
      setGridSize({
        width: Math.floor(entry.contentRect.width),
        gap: Number.parseFloat(getComputedStyle(list).columnGap) || 0,
      })
    );
    observer.observe(list);
    return () => observer.disconnect();
  }, []);
  const ratios = useMemo(
    () => photos.map((p) => p.width / (p.height * aboveWatermark(p))),
    [photos]
  );
  // Per photo: its tile width and whether it absorbs the row's rounding.
  const tiles = useMemo(() => {
    const { width, gap } = gridSize;
    if (width === 0) {
      return;
    }
    const target = window.innerWidth < SM ? TARGET_ROW.phone : TARGET_ROW.wide;
    const rows = justifyRows(ratios, width, target, gap);
    return rows.flatMap((row) =>
      ratios.slice(row.start, row.end).map((ratio, k) => ({
        width: Math.floor(ratio * row.height),
        grow: row.fills && row.start + k === row.end - 1,
      }))
    );
  }, [ratios, gridSize]);

  return (
    <>
      <ul
        className="flex flex-wrap gap-1.5 [--row:6.5rem] after:grow-[999] after:content-[''] sm:gap-2 sm:[--row:11rem]"
        ref={grid}
      >
        {photos.map((photo, i) => {
          const ratio = ratios[i];
          const tile = tiles?.[i];
          return (
            <li
              key={photo.id}
              style={
                tile
                  ? { width: tile.width, flexGrow: tile.grow ? 1 : 0 }
                  : {
                      flexGrow: ratio,
                      flexBasis: `calc(var(--row) * ${ratio})`,
                    }
              }
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
                  // Stays the CSS estimate after layout, so eager images are not fetched twice.
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
          const plainKey = !(event.metaKey || event.ctrlKey || event.altKey);
          if (plainKey && event.key.toLowerCase() === 'i' && current?.exif) {
            toggleInfo();
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
              <span aria-live="polite" className="text-xs text-white/80">
                {copied ? labels.linkCopied : ''}
              </span>
              <button
                aria-label={labels.share}
                className="rounded-full p-2 hover:bg-white/10"
                onClick={() => share(current)}
                title={labels.share}
                type="button"
              >
                <Share2 aria-hidden="true" size={18} />
              </button>
              {current.exif ? (
                <button
                  aria-label={labels.details}
                  aria-pressed={showInfo}
                  className="rounded-full p-2 hover:bg-white/10 aria-pressed:bg-white/15"
                  onClick={toggleInfo}
                  ref={infoButton}
                  title={`${labels.details} (i)`}
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

            <div className="relative flex min-h-0 flex-1">
              <figure className="relative flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-2 pb-4">
                <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: pre-sized on S3 */}
                  <img
                    alt={altOf(current, index, false)}
                    className="peer relative z-10 max-h-full max-w-full object-contain opacity-0 data-loaded:opacity-100 motion-safe:transition-opacity motion-safe:duration-300"
                    height={current.height}
                    key={current.id}
                    onLoad={reveal}
                    ref={revealWhenLoaded}
                    src={photoUrl(current.id, '2048')}
                    width={current.width}
                  />
                  {/* The cached thumbnail stands in, blurred, until the sharp one loads; then it
                    hides so its blur does not glow around the photo. */}
                  {/* biome-ignore lint/performance/noImgElement: pre-sized on S3 */}
                  <img
                    alt=""
                    aria-hidden="true"
                    className="absolute max-h-full max-w-full object-contain blur-md peer-data-loaded:invisible"
                    height={current.height}
                    key={`thumb-${current.id}`}
                    src={photoUrl(current.id, 'thumb')}
                    width={current.width}
                  />
                </div>
                {localized(current.caption, lang) ? (
                  <figcaption className="max-w-prose pt-3 text-center text-sm text-white/80">
                    {localized(current.caption, lang)}
                  </figcaption>
                ) : null}
                <button
                  aria-label={labels.previous}
                  className={`absolute top-1/2 left-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 ${arrows}`}
                  onClick={() => step(-1)}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={24} />
                </button>
                <button
                  aria-label={labels.next}
                  className={`absolute top-1/2 right-2 z-20 hidden -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 ${arrows}`}
                  onClick={() => step(1)}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={24} />
                </button>
                <p
                  className={`pointer-events-none absolute left-1/2 ${current.caption ? 'bottom-20' : 'bottom-8'} z-20 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm whitespace-nowrap motion-safe:animate-pulse ${hint ? '' : 'hidden'}`}
                  role="status"
                >
                  {hint ? (
                    <>
                      <span aria-hidden="true">← </span>
                      {labels.swipeHint}
                      <span aria-hidden="true"> →</span>
                    </>
                  ) : null}
                </p>
              </figure>
              {showInfo && current.exif ? (
                <PhotoInfo
                  labels={{
                    details: labels.details,
                    close: labels.closeDetails,
                    specs: labels.specs,
                  }}
                  lang={lang}
                  onClose={toggleInfo}
                  photo={current}
                />
              ) : null}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
