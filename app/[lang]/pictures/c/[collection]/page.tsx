import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AlbumGrid } from '@/components/pictures/album-grid';
import { Breadcrumb } from '@/components/pictures/breadcrumb';
import {
  CollectionMosaic,
  CollectionTabs,
  collectionStats,
} from '@/components/pictures/collections';
import { getContent } from '@/lib/content';
import { isLocale, localizedPath } from '@/lib/locale';
import {
  albumsIn,
  getManifest,
  localized,
  mosaicPhotos,
  photoUrl,
} from '@/lib/pictures/manifest';

// Published without a deploy: unlisted collections render on first visit, also when the
// CDN is down at build time.
export async function generateStaticParams() {
  const { collections } = await getManifest().catch(() => ({
    collections: [],
  }));
  return collections.map((c) => ({ collection: c.slug }));
}

async function load(lang: string, slug: string) {
  if (!isLocale(lang)) {
    notFound();
  }
  const { albums, collections } = await getManifest();
  const collection = collections.find((c) => c.slug === slug);
  const members = albumsIn(albums, collections, slug);
  if (!collection || members.length === 0) {
    notFound();
  }
  return { lang, collection, collections, members };
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures/c/[collection]'>): Promise<Metadata> {
  const { lang: raw, collection: slug } = await params;
  const { lang, collection, members } = await load(raw, slug);
  const path = `/pictures/c/${slug}`;
  const title = `${localized(collection.title, lang)} — Camila Pozas`;
  const url = localizedPath(path, lang);
  const [lead] = mosaicPhotos(members, collection.coverAlbum);
  return {
    title,
    description:
      localized(collection.description, lang) ||
      collectionStats(getContent(lang), members, lang),
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
      images: [photoUrl(lead.id, '1200')],
    },
  };
}

export default async function CollectionPage({
  params,
}: PageProps<'/[lang]/pictures/c/[collection]'>) {
  const { lang: raw, collection: slug } = await params;
  const { lang, collection, collections, members } = await load(raw, slug);
  const content = getContent(lang);
  const title = localized(collection.title, lang);
  const description = localized(collection.description, lang);

  return (
    <>
      <Breadcrumb
        crumbs={[
          {
            label: content.picturesLabel,
            href: localizedPath('/pictures', lang),
          },
          { label: title },
        ]}
      />
      <header className="mt-4">
        <CollectionMosaic
          albums={members}
          coverAlbum={collection.coverAlbum}
          eager
        />
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-muted text-sm">
            {collectionStats(content, members, lang)}
          </p>
        </div>
        {description && <p className="text-muted mt-1">{description}</p>}
      </header>
      <CollectionTabs
        active={slug}
        collections={collections}
        content={content}
        lang={lang}
      />
      <div className="mt-4">
        <AlbumGrid albums={members} content={content} lang={lang} />
      </div>
    </>
  );
}
