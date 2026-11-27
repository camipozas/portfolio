import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PhotoGallery } from '@/components/pictures/photo-gallery';
import { getContent, photoCount } from '@/lib/content';
import { isLocale, localizedPath } from '@/lib/locale';
import { formatDateRange } from '@/lib/pictures/exif';
import {
  getAlbum,
  getAlbums,
  localized,
  photoUrl,
} from '@/lib/pictures/manifest';

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures/[album]'>): Promise<Metadata> {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const album = await getAlbum(slug);
  if (!album) {
    notFound();
  }
  const path = `/pictures/${slug}`;
  const title = `${localized(album.title, lang)} — Camila Pozas`;
  const url = localizedPath(path, lang);
  return {
    title,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath(path, 'en'),
        es: localizedPath(path, 'es'),
        'x-default': path,
      },
    },
    openGraph: {
      title,
      url,
      type: 'website',
      images: [photoUrl(album.coverId, '2048')],
    },
  };
}

export default async function AlbumPage({
  params,
}: PageProps<'/[lang]/pictures/[album]'>) {
  const { lang, album: slug } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const albums = await getAlbums();
  const position = albums.findIndex((a) => a.slug === slug);
  if (position < 0) {
    notFound();
  }
  const album = albums[position];
  const next =
    albums.length > 1 ? albums[(position + 1) % albums.length] : undefined;
  const content = getContent(lang);
  const { ui } = content;
  const title = localized(album.title, lang);
  const dates = formatDateRange(
    album.photos.map((photo) => photo.exif?.takenAt),
    lang
  );

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex items-center gap-2">
          <li>
            <a
              className="text-muted hover:text-accent inline-flex items-center gap-1.5 transition-colors"
              href={localizedPath('/pictures', lang)}
            >
              <ArrowLeft aria-hidden="true" size={16} />
              {content.picturesLabel}
            </a>
          </li>
          <li aria-hidden="true" className="text-muted">
            /
          </li>
          <li aria-current="page" className="truncate">
            {title}
          </li>
        </ol>
      </nav>
      <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
      <p className="text-muted mt-1 mb-8 text-sm">
        {[photoCount(content, album.photos.length), dates]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <PhotoGallery
        albumTitle={title}
        labels={{
          close: ui.close,
          previous: ui.previousPhoto,
          next: ui.nextPhoto,
          openFullSize: ui.openFullSize,
          details: ui.photoDetails,
        }}
        lang={lang}
        photos={album.photos}
      />
      {next ? (
        <a
          className="group border-border hover:border-accent mt-12 flex items-center gap-4 rounded-xl border p-3 transition-colors"
          href={localizedPath(`/pictures/${next.slug}`, lang)}
        >
          {/* biome-ignore lint/performance/noImgElement: pre-sized on S3; next/image would re-optimize them on Vercel */}
          <img
            alt=""
            className="size-16 rounded-lg object-cover"
            loading="lazy"
            src={photoUrl(next.coverId, 'thumb')}
          />
          <span className="flex-1">
            <span className="text-muted block text-xs">{ui.nextAlbum}</span>
            <span className="group-hover:text-accent font-medium">
              {localized(next.title, lang)}
            </span>
          </span>
          <ArrowRight aria-hidden="true" className="text-muted" size={18} />
        </a>
      ) : null}
    </>
  );
}
