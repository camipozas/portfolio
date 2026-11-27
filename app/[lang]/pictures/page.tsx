import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlbumGrid } from '@/components/pictures/album-grid';
import {
  CollectionCard,
  CollectionTabs,
} from '@/components/pictures/collections';
import { getContent } from '@/lib/content';
import { isLocale, localizedPath } from '@/lib/locale';
import { albumsIn, getManifest } from '@/lib/pictures/manifest';

// Only `lang` varies here: other first segments 404 without a render.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures'>): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const content = getContent(lang);
  const title = `${content.picturesLabel} — Camila Pozas`;
  const url = localizedPath('/pictures', lang);
  return {
    title,
    description: content.ui.picturesIntro,
    alternates: {
      canonical: url,
      languages: {
        en: localizedPath('/pictures', 'en'),
        es: localizedPath('/pictures', 'es'),
        'x-default': '/pictures',
      },
    },
    openGraph: { title, url, type: 'website' },
  };
}

export default async function PicturesPage({
  params,
}: PageProps<'/[lang]/pictures'>) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const content = getContent(lang);
  // A CDN outage must not block deploys; ISR refills the page on the next revalidate.
  const { albums, collections } = await getManifest().catch(() => ({
    albums: [],
    collections: [],
  }));
  const loose = albumsIn(albums, collections);

  return (
    <>
      <h1 className="text-2xl font-semibold">{content.picturesLabel}</h1>
      <p className="text-muted mt-2">{content.ui.picturesIntro}</p>
      {albums.length === 0 && (
        <p className="text-muted mt-10">{content.ui.picturesEmpty}</p>
      )}
      {albums.length > 0 && collections.length === 0 && (
        <div className="mt-10">
          <AlbumGrid albums={albums} content={content} lang={lang} />
        </div>
      )}
      {albums.length > 0 && collections.length > 0 && (
        <>
          <CollectionTabs
            collections={collections}
            content={content}
            lang={lang}
          />
          <ul className="mt-4 grid gap-14">
            {collections.map((collection, i) => (
              <li key={collection.slug}>
                <CollectionCard
                  albums={albumsIn(albums, collections, collection.slug)}
                  collection={collection}
                  content={content}
                  eager={i === 0}
                  lang={lang}
                />
              </li>
            ))}
          </ul>
          {loose.length > 0 && (
            <section aria-labelledby="more-albums" className="mt-16">
              <h2 className="mb-4 text-lg font-semibold" id="more-albums">
                {content.ui.picturesMore}
              </h2>
              <AlbumGrid
                albums={loose}
                content={content}
                heading="h3"
                lang={lang}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
