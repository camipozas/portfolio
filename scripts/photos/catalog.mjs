#!/usr/bin/env node
// Builds curation/catalog.json (every backed-up photo, by album) for the backoffice.
//   AWS_PROFILE=photos node scripts/photos/catalog.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const root = process.env.ROOT ?? join(homedir(), 'Pictures/lightroom-backup');
const bucket = process.env.BUCKET ?? 'camipg-photos-backup-326733328768';

const rows = (file) =>
  readFileSync(join(root, file), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'));

const EXTENSION = /\.[^./]+$/u;
const withoutExtension = (path) => path.replace(EXTENSION, '');
const albumOf = (path) => path.slice(0, path.lastIndexOf('/'));

function photo(sha, path) {
  const base = withoutExtension(path);
  const metaFile = join(root, 'web/meta', `${base}.json`);
  if (!existsSync(metaFile)) {
    return;
  }
  const {
    width,
    height,
    color,
    exif = {},
  } = JSON.parse(readFileSync(metaFile, 'utf8'));
  return {
    id: sha.slice(0, 16),
    path: base,
    width,
    height,
    color,
    exif: {
      make: exif.Make,
      model: exif.Model,
      lens: exif.LensModel,
      focalLength: exif.FocalLength,
      fNumber: exif.FNumber,
      exposureTime: exif.ExposureTime,
      iso: exif.ISO,
      takenAt: exif.DateTimeOriginal,
    },
  };
}

const albums = new Map();
const add = (album, item) =>
  albums.set(album, [...(albums.get(album) ?? []), item]);
const byPath = new Map();

for (const [sha, path] of rows('index.tsv')) {
  const item = photo(sha, path);
  if (!item) {
    continue;
  }
  byPath.set(path, item);
  add(albumOf(path), item);
}
// Stored once on disk, but listed in every album it belongs to.
for (const [, firstPath, otherPath] of rows('duplicates.tsv')) {
  const item = byPath.get(firstPath);
  if (item) {
    add(albumOf(otherPath), item);
  }
}

const catalog = {
  generatedAt: new Date().toISOString(),
  albums: [...albums]
    .map(([key, photos]) => ({
      key,
      photos: [...new Map(photos.map((p) => [p.id, p])).values()].sort((a, b) =>
        (a.exif.takenAt ?? '').localeCompare(b.exif.takenAt ?? '')
      ),
    }))
    .sort((a, b) => a.key.localeCompare(b.key)),
};

const out = join(root, 'catalog.json');
writeFileSync(out, JSON.stringify(catalog));
execFileSync(
  'aws',
  [
    's3',
    'cp',
    out,
    `s3://${bucket}/curation/catalog.json`,
    '--only-show-errors',
  ],
  {
    stdio: 'inherit',
  }
);
const total = catalog.albums.reduce((n, album) => n + album.photos.length, 0);
console.log(`catalog: ${catalog.albums.length} albums, ${total} album entries`);
