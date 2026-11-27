"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  SESSION_COOKIE,
  SESSION_SECONDS,
  sameText,
  sessionSecret,
  verifyPassword,
} from "@/lib/backoffice/auth";
import {
  type AlbumState,
  buildManifest,
  catalogIndex,
  planPublish,
  syncState,
} from "@/lib/backoffice/curation";
import { requireSession } from "@/lib/backoffice/session";
import {
  listPublishedIds,
  publishPhoto,
  readCatalog,
  readState,
  unpublishPhotos,
  writeManifest,
  writeState,
} from "@/lib/backoffice/storage";

export async function login(formData: FormData): Promise<void> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok =
    sameText(username, process.env.ADMIN_USERNAME ?? "") &&
    verifyPassword(password, process.env.ADMIN_PASSWORD_HASH ?? "");
  if (!ok) {
    // Slows down guessing; Vercel's firewall rate limit is the real barrier.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    redirect("/admin/login?error=1");
  }
  (await cookies()).set(SESSION_COOKIE, createSession(sessionSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
  redirect("/admin");
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

async function currentState() {
  return syncState(await readCatalog(), await readState());
}

export async function saveAlbums(
  albums: Omit<AlbumState, "photos">[],
): Promise<void> {
  await requireSession();
  const state = await currentState();
  const byKey = new Map(state.albums.map((album) => [album.key, album]));
  await writeState({
    albums: albums.flatMap((album) => {
      const known = byKey.get(album.key);
      return known
        ? [
            {
              ...known,
              title: album.title,
              slug: album.slug,
              visible: album.visible,
            },
          ]
        : [];
    }),
  });
}

export async function saveAlbumPhotos(
  key: string,
  photos: AlbumState["photos"],
  coverId: string | undefined,
): Promise<void> {
  await requireSession();
  const state = await currentState();
  await writeState({
    albums: state.albums.map((album) =>
      album.key === key ? { ...album, photos, coverId } : album,
    ),
  });
}

export async function publish(): Promise<{
  albums: number;
  photos: number;
  copied: number;
  removed: number;
}> {
  await requireSession();
  const catalog = await readCatalog();
  const manifest = buildManifest(
    catalog,
    syncState(catalog, await readState()),
    new Date().toISOString(),
  );
  const { copy, remove } = planPublish(manifest, await listPublishedIds());
  const paths = catalogIndex(catalog);
  for (let i = 0; i < copy.length; i += 8) {
    await Promise.all(
      copy
        .slice(i, i + 8)
        .map((id) => publishPhoto(id, paths.get(id)?.path as string)),
    );
  }
  // Manifest before deletes: the site never points at a photo that is already gone.
  await writeManifest(manifest);
  await unpublishPhotos(remove);
  return {
    albums: manifest.albums.length,
    photos: manifest.albums.reduce((n, album) => n + album.photos.length, 0),
    copied: copy.length,
    removed: remove.length,
  };
}
