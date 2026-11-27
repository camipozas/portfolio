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
  listPublished,
  publishPhoto,
  readCatalog,
  readLoginAttempts,
  readPublishedManifest,
  readState,
  unpublishPhotos,
  writeLoginAttempts,
  writeManifest,
  writeState,
} from "@/lib/backoffice/storage";

const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

export async function login(formData: FormData): Promise<void> {
  const now = Date.now();
  const recent = (await readLoginAttempts()).failures.filter(
    (t) => now - t < LOCK_WINDOW_MS,
  );
  if (recent.length >= MAX_FAILURES) redirect("/admin/login?error=locked");

  // Both checks always run, so timing does not reveal whether the username was right.
  const userOk = sameText(
    String(formData.get("username") ?? ""),
    process.env.ADMIN_USERNAME ?? "",
  );
  const passwordOk = verifyPassword(
    String(formData.get("password") ?? ""),
    process.env.ADMIN_PASSWORD_HASH ?? "",
  );
  if (!userOk || !passwordOk) {
    await writeLoginAttempts({ failures: [...recent, now] });
    redirect("/admin/login?error=1");
  }

  await writeLoginAttempts({ failures: [] });
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

/** Order, titles and visibility from the page; slugs and photo choices stay server-side. */
export async function saveAlbums(
  albums: Pick<AlbumState, "key" | "title" | "visible">[],
): Promise<void> {
  await requireSession();
  const state = await currentState();
  const edits = new Map(albums.map((album) => [album.key, album]));
  const ordered = albums.flatMap((edit) =>
    state.albums.filter((album) => album.key === edit.key),
  );
  const untouched = state.albums.filter((album) => !edits.has(album.key));
  await writeState({
    albums: [...ordered, ...untouched].map((album) => {
      const edit = edits.get(album.key);
      return edit
        ? { ...album, title: edit.title, visible: edit.visible }
        : album;
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

export async function publish() {
  await requireSession();
  const catalog = await readCatalog();
  const manifest = buildManifest(
    catalog,
    syncState(catalog, await readState()),
    new Date().toISOString(),
  );
  const { copy, remove } = planPublish(
    manifest,
    await listPublished(),
    await readPublishedManifest(),
  );
  const paths = catalogIndex(catalog);
  for (let i = 0; i < copy.length; i += 24) {
    await Promise.all(
      copy
        .slice(i, i + 8)
        .map((id) => publishPhoto(id, paths.get(id)?.path as string)),
    );
  }
  await writeManifest(manifest);
  await unpublishPhotos(remove);
  return {
    albums: manifest.albums.length,
    photos: manifest.albums.reduce((n, album) => n + album.photos.length, 0),
    copied: copy.length,
    removed: remove.length,
  };
}
