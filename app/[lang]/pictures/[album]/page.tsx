import { getManifest } from '@/lib/pictures/manifest';
import { AlbumView, albumMetadata } from './album-view';

// Published without a deploy: unlisted albums render on first visit, also when the
// CDN is down at build time.
export async function generateStaticParams() {
  const { albums } = await getManifest().catch(() => ({ albums: [] }));
  return albums.map((a) => ({ album: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures/[album]'>) {
  const { lang, album } = await params;
  return albumMetadata(lang, album);
}

export default async function AlbumPage({
  params,
}: PageProps<'/[lang]/pictures/[album]'>) {
  const { lang, album } = await params;
  return <AlbumView lang={lang} slug={album} />;
}
