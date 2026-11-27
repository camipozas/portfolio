import type { Locale } from "@/lib/locale";
import type { PhotoExif } from "./types";

export function formatExposure(seconds: number): string {
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

export function formatCamera(exif: PhotoExif): string | undefined {
  const { make, model } = exif;
  if (!make || !model) return model ?? make;
  return model.toLowerCase().startsWith(make.toLowerCase())
    ? model
    : `${make} ${model}`;
}

export function formatTakenAt(
  takenAt: string,
  lang: Locale,
): string | undefined {
  const m = takenAt.match(/^(\d{4}):(\d{2}):(\d{2})/);
  if (!m) return undefined;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return date.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
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
    .join(" · ");
}
