import { AlbumView, albumMetadata } from '../album-view';

// One page per photo, so a shared link previews that photo. None is built ahead:
// each renders on its first visit and is cached from then on.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/pictures/[album]/[photo]'>) {
  const { lang, album, photo } = await params;
  return albumMetadata(lang, album, photo);
}

export default async function PhotoPage({
  params,
}: PageProps<'/[lang]/pictures/[album]/[photo]'>) {
  const { lang, album, photo } = await params;
  return <AlbumView lang={lang} photoId={photo} slug={album} />;
}
