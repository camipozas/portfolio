import type { Locale } from '@/lib/locale';
import type { PhotoExif } from './types';

const EXIF_DATE = /^(?<year>\d{4}):(?<month>\d{2}):(?<day>\d{2})/u;

export function formatExposure(seconds: number): string {
  if (seconds >= 1) {
    return `${Number(seconds.toFixed(1))}s`;
  }
  return `1/${Math.round(1 / seconds)}s`;
}

export function formatCamera(exif: PhotoExif): string | undefined {
  const { make, model } = exif;
  if (!(make && model)) {
    return model ?? make;
  }
  return model.toLowerCase().startsWith(make.toLowerCase())
    ? model
    : `${make} ${model}`;
}

export function formatTakenAt(
  takenAt: string,
  lang: Locale
): string | undefined {
  const groups = takenAt.match(EXIF_DATE)?.groups;
  if (!groups) {
    return undefined;
  }
  const date = new Date(Date.UTC(+groups.year, +groups.month - 1, +groups.day));
  return date.toLocaleDateString(lang === 'es' ? 'es-CL' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatSettings(exif: PhotoExif): string {
  return [
    exif.fNumber ? `ƒ/${Number(exif.fNumber.toFixed(1))}` : undefined,
    exif.exposureTime ? formatExposure(exif.exposureTime) : undefined,
    exif.iso ? `ISO ${exif.iso}` : undefined,
    exif.focalLength ? `${Number(exif.focalLength.toFixed(1))}mm` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
}

const YEAR_MONTH = /^(?<year>\d{4}):(?<month>\d{2})/u;

/** "May 2025", or "Apr – May 2025" / "Dec 2024 – Jan 2025" across months. */
export function formatDateRange(
  takenAts: (string | undefined)[],
  lang: Locale
): string | undefined {
  const months = takenAts
    .map((t) => t?.match(YEAR_MONTH)?.groups)
    .filter((g) => g !== undefined)
    .map((g) => `${g.year}-${g.month}`)
    .sort();
  if (months.length === 0) {
    return undefined;
  }
  const locale = lang === 'es' ? 'es-CL' : 'en-US';
  const label = (ym: string, withYear: boolean) =>
    new Date(`${ym}-01T00:00:00Z`).toLocaleDateString(locale, {
      month: 'short',
      year: withYear ? 'numeric' : undefined,
      timeZone: 'UTC',
    });
  const first = months[0];
  const last = months.at(-1) as string;
  if (first === last) {
    return label(first, true);
  }
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  return `${label(first, !sameYear)} – ${label(last, true)}`;
}
