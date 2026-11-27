import type { Locale } from '@/lib/locale';
import type { PhotoExif } from './types';

const EXIF_DATE =
  /^(?<year>\d{4}):(?<month>\d{2}):(?<day>\d{2})(?: (?<hour>\d{2}):(?<minute>\d{2}))?/u;

export function formatExposure(seconds: number): string {
  if (seconds >= 1) {
    return `${Number(seconds.toFixed(1))} s`;
  }
  return `1/${Math.round(1 / seconds)} s`;
}

// Sony bodies report their code: ILCE-6400 is the α6400, ILCE-7RM5 the α7R V.
const SONY_ALPHA = /^ILCE-(?<body>\d+[A-Z]*?)(?:M(?<gen>\d))?$/u;
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const TRAILING_ZERO = /(?<digit>\d)\.0\b/gu;

const brandOf = (make: string) => {
  const word = make.split(' ')[0];
  const shouting = word.length > 3 && word === word.toUpperCase();
  return shouting ? word[0] + word.slice(1).toLowerCase() : word;
};

/** "Sony α6400", "Nikon D5100", "iPhone 16 Pro". */
export function formatCamera(exif: PhotoExif): string | undefined {
  const { make, model } = exif;
  if (!model) {
    return make && brandOf(make);
  }
  const brand = make ? brandOf(make) : '';
  const bare = model.toLowerCase().startsWith(`${brand.toLowerCase()} `)
    ? model.slice(brand.length + 1)
    : model;
  const alpha = bare.match(SONY_ALPHA)?.groups;
  const name = alpha
    ? `α${alpha.body}${alpha.gen ? ` ${ROMAN[+alpha.gen]}` : ''}`
    : bare;
  // Phones name themselves ("iPhone 16 Pro"); cameras need the brand.
  return !brand || make === 'Apple' || make === 'Google'
    ? name
    : `${brand} ${name}`;
}

/** The lens, unless it only repeats a phone's model ("iPhone 16 Pro back camera …"). */
export function formatLens(exif: PhotoExif): string | undefined {
  const { lens, model } = exif;
  if (!lens || (model && lens.startsWith(model))) {
    return undefined;
  }
  return lens.replace(TRAILING_ZERO, '$<digit>');
}

export function formatTakenAt(
  takenAt: string,
  lang: Locale
): string | undefined {
  const groups = takenAt.match(EXIF_DATE)?.groups;
  if (!groups) {
    return undefined;
  }
  // EXIF stores the camera's wall-clock time without a zone: show it as is.
  const date = new Date(
    Date.UTC(
      +groups.year,
      +groups.month - 1,
      +groups.day,
      +(groups.hour ?? 0),
      +(groups.minute ?? 0)
    )
  );
  return date.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', {
    dateStyle: 'long',
    timeStyle: groups.hour ? 'short' : undefined,
    hourCycle: lang === 'es' ? 'h23' : undefined,
    timeZone: 'UTC',
  });
}

export type ExposureSpec = 'aperture' | 'shutter' | 'iso' | 'focalLength';

/** Exposure settings the photo has, in the order photographers read them. */
export function exposureSpecs(
  exif: PhotoExif
): { spec: ExposureSpec; value: string }[] {
  const specs: { spec: ExposureSpec; value: string | undefined }[] = [
    {
      spec: 'aperture',
      value: exif.fNumber ? `ƒ/${Number(exif.fNumber.toFixed(1))}` : undefined,
    },
    {
      spec: 'shutter',
      value: exif.exposureTime ? formatExposure(exif.exposureTime) : undefined,
    },
    { spec: 'iso', value: exif.iso ? `${exif.iso}` : undefined },
    {
      spec: 'focalLength',
      value: exif.focalLength
        ? `${Number(exif.focalLength.toFixed(1))} mm`
        : undefined,
    },
  ];
  return specs.filter(
    (s): s is { spec: ExposureSpec; value: string } => s.value !== undefined
  );
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
