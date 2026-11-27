import { Camera, X } from 'lucide-react';
import type { Locale } from '@/lib/locale';
import type { ExposureSpec } from '@/lib/pictures/exif';
import {
  exposureSpecs,
  formatCamera,
  formatLens,
  formatTakenAt,
} from '@/lib/pictures/exif';
import type { Photo } from '@/lib/pictures/types';

export interface PhotoInfoLabels {
  details: string;
  close: string;
  specs: Record<ExposureSpec, string>;
}

interface PhotoInfoProps {
  photo: Photo;
  lang: Locale;
  labels: PhotoInfoLabels;
  onClose: () => void;
}

/** Side panel on wide screens, bottom sheet on phones. */
export function PhotoInfo({ photo, lang, labels, onClose }: PhotoInfoProps) {
  const exif = photo.exif ?? {};
  const camera = formatCamera(exif);
  const lens = formatLens(exif);
  const takenAt = exif.takenAt && formatTakenAt(exif.takenAt, lang);
  const specs = exposureSpecs(exif);

  return (
    <aside
      aria-label={labels.details}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] overflow-y-auto rounded-t-2xl bg-neutral-900/95 p-5 backdrop-blur md:static md:max-h-none md:w-80 md:shrink-0 md:rounded-none md:border-l md:border-white/10 md:bg-transparent md:backdrop-blur-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">{labels.details}</h2>
          {takenAt ? (
            <p className="mt-0.5 text-sm text-white/60">{takenAt}</p>
          ) : null}
        </div>
        <button
          aria-label={labels.close}
          className="-m-1.5 rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      {camera ? (
        <div className="mt-5 flex gap-3">
          <Camera
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-white/50"
            size={18}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">{camera}</p>
            {lens ? <p className="text-sm text-white/60">{lens}</p> : null}
          </div>
        </div>
      ) : null}

      {specs.length > 0 ? (
        <dl
          className="mt-4 grid divide-x divide-white/10 rounded-lg border border-white/10"
          style={{ gridTemplateColumns: `repeat(${specs.length}, 1fr)` }}
        >
          {specs.map(({ spec, value }) => (
            <div
              className="flex flex-col-reverse items-center gap-0.5 px-1 py-2.5 text-center"
              key={spec}
            >
              <dt className="text-[11px] leading-tight text-white/50">
                {labels.specs[spec]}
              </dt>
              <dd className="text-sm font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="mt-4 text-xs text-white/50 tabular-nums">
        {photo.width} × {photo.height} px
      </p>
    </aside>
  );
}
