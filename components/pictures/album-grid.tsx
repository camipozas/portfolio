import type { Content } from '@/lib/content';
import { photoCount } from '@/lib/content';
import type { Locale } from '@/lib/locale';
import { localizedPath } from '@/lib/locale';
import { formatDateRange } from '@/lib/pictures/exif';
import { localized, photoUrl } from '@/lib/pictures/manifest';
import type { Album } from '@/lib/pictures/types';

export function AlbumGrid({
  albums,
  content,
  lang,
  heading: Heading = 'h2',
}: {
  albums: Album[];
  content: Content;
  lang: Locale;
  heading?: 'h2' | 'h3';
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <li key={album.slug}>
          <a
            className="group focus-visible:outline-accent block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
            href={localizedPath(`/pictures/${album.slug}`, lang)}
          >
            <div className="bg-border overflow-hidden rounded-lg">
              {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
              <img
                alt=""
                className="aspect-[4/3] w-full object-cover motion-safe:transition motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
                decoding="async"
                loading="lazy"
                src={photoUrl(album.coverId, 'thumb')}
              />
            </div>
            <Heading className="group-hover:text-accent mt-2 font-medium">
              {localized(album.title, lang)}
            </Heading>
            <p className="text-muted text-sm">
              {[
                photoCount(content, album.photos.length),
                formatDateRange(
                  album.photos.map((photo) => photo.exif?.takenAt),
                  lang
                ),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
