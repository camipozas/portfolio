"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/locale";
import {
  formatCamera,
  formatSettings,
  formatTakenAt,
} from "@/lib/pictures/exif";
import { localized, photoUrl } from "@/lib/pictures/manifest";
import type { Photo } from "@/lib/pictures/types";

interface PhotoGalleryProps {
  photos: Photo[];
  albumTitle: string;
  lang: Locale;
  labels: {
    close: string;
    previous: string;
    next: string;
    openFullSize: string;
  };
}

export function PhotoGallery({
  photos,
  albumTitle,
  lang,
  labels,
}: PhotoGalleryProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? undefined : photos[index];

  const altOf = (photo: Photo, i: number) =>
    localized(photo.alt, lang) || `${albumTitle} ${i + 1}/${photos.length}`;
  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (delta: number) =>
    setIndex((i) =>
      i === null ? i : (i + delta + photos.length) % photos.length,
    );

  return (
    <>
      <ul className="columns-2 gap-3 sm:columns-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => open(i)}
              className="block w-full overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-accent"
            >
              {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
              <img
                src={photoUrl(photo.id, "thumb")}
                alt={altOf(photo, i)}
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full transition-opacity hover:opacity-90"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={albumTitle}
        onClose={() => setIndex(null)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") step(-1);
          if (event.key === "ArrowRight") step(1);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/90"
      >
        {current && index !== null && (
          <figure className="flex h-full flex-col items-center justify-center gap-3 p-4">
            {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
            <img
              key={current.id}
              src={photoUrl(current.id, "2048")}
              alt={altOf(current, index)}
              width={current.width}
              height={current.height}
              className="max-h-[80dvh] w-auto max-w-full object-contain"
            />
            <figcaption className="text-center text-xs text-white/70">
              {current.exif && (
                <>
                  <p>
                    {[formatCamera(current.exif), current.exif.lens]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p>
                    {[
                      formatSettings(current.exif),
                      current.exif.takenAt &&
                        formatTakenAt(current.exif.takenAt, lang),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </>
              )}
            </figcaption>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={labels.previous}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <a
                href={photoUrl(current.id, "full")}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm hover:bg-white/10"
              >
                <Download size={16} aria-hidden="true" />
                {labels.openFullSize}
              </a>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={labels.next}
                className="rounded-full p-2 hover:bg-white/10"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={labels.close}
              className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/10"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </figure>
        )}
      </dialog>
    </>
  );
}
