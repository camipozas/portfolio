import { revalidateTag } from 'next/cache';
import { sameText } from '@/lib/backoffice/auth';
import { PICTURES_TAG } from '@/lib/pictures/manifest';

const BEARER = /^Bearer /u;

// Called by the backoffice right after publishing, so /pictures shows it at once.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = request.headers.get('authorization')?.replace(BEARER, '') ?? '';
  if (!(secret && sameText(given, secret))) {
    return new Response('Unauthorized', { status: 401 });
  }
  revalidateTag(PICTURES_TAG, { expire: 0 });
  return Response.json({ revalidated: true });
}
