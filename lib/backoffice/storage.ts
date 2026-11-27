import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import type { Manifest } from "@/lib/pictures/types";
import type { Catalog, CurationState } from "./curation";

const BACKUP =
  process.env.PHOTOS_BACKUP_BUCKET ?? "camipg-photos-backup-326733328768";
const ASSETS = process.env.PHOTOS_ASSETS_BUCKET ?? "assets-portfolio";
const SIZES = ["thumb", "2048", "full"] as const;

// On Vercel the role comes from OIDC; locally the default chain (AWS_PROFILE=photos).
const s3 = new S3Client({
  region: "us-east-1",
  credentials: process.env.AWS_ROLE_ARN
    ? awsCredentialsProvider({ roleArn: process.env.AWS_ROLE_ARN })
    : undefined,
});

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const object = await s3.send(
      new GetObjectCommand({ Bucket: BACKUP, Key: key }),
    );
    return (
      JSON.parse(await (object.Body?.transformToString() ?? "null")) ?? fallback
    );
  } catch (error) {
    if (error instanceof NoSuchKey) return fallback;
    throw error;
  }
}

export const readCatalog = () =>
  readJson<Catalog>("curation/catalog.json", { generatedAt: "", albums: [] });
export const readState = () =>
  readJson<CurationState>("curation/state.json", { albums: [] });

export async function writeState(state: CurationState): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BACKUP,
      Key: "curation/state.json",
      Body: JSON.stringify(state),
      ContentType: "application/json",
    }),
  );
}

export function thumbUrl(path: string): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BACKUP, Key: `web/thumb/${path}.jpg` }),
    { expiresIn: 3600 },
  );
}

export async function listPublishedIds(): Promise<string[]> {
  const ids: string[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: ASSETS,
        Prefix: "photos/p/",
        Delimiter: "/",
        ContinuationToken: token,
      }),
    );
    for (const prefix of page.CommonPrefixes ?? []) {
      ids.push(prefix.Prefix?.split("/")[2] ?? "");
    }
    token = page.NextContinuationToken;
  } while (token);
  return ids.filter(Boolean);
}

const copySource = (key: string) =>
  `${BACKUP}/${key.split("/").map(encodeURIComponent).join("/")}`;

export async function publishPhoto(id: string, path: string): Promise<void> {
  await Promise.all(
    SIZES.map((size) =>
      s3.send(
        new CopyObjectCommand({
          Bucket: ASSETS,
          Key: `photos/p/${id}/${size}.jpg`,
          CopySource: copySource(`web/${size}/${path}.jpg`),
          MetadataDirective: "REPLACE",
          TaggingDirective: "REPLACE",
          ContentType: "image/jpeg",
          // The id is a content hash, so the file under it never changes.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      ),
    ),
  );
}

export async function unpublishPhotos(ids: string[]): Promise<void> {
  const keys = ids.flatMap((id) =>
    SIZES.map((size) => ({ Key: `photos/p/${id}/${size}.jpg` })),
  );
  for (let i = 0; i < keys.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: ASSETS,
        Delete: { Objects: keys.slice(i, i + 1000) },
      }),
    );
  }
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: ASSETS,
      Key: "photos/manifest.json",
      Body: JSON.stringify(manifest),
      ContentType: "application/json",
      CacheControl: "public, max-age=300",
    }),
  );
}
