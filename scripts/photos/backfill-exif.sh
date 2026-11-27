#!/usr/bin/env bash
# Adds the EXIF tags derive.sh reads to photos derived before it read them; no image is rebuilt.
#   scripts/photos/backfill-exif.sh
# Then the backoffice shows unpublished changes: press Publicar. Safe to re-run.
set -euo pipefail

ROOT=${ROOT:-$HOME/Pictures/lightroom-backup}
BUCKET=${BUCKET:-camipg-photos-backup-326733328768}
here=$(cd "$(dirname "$0")" && pwd)
# Never a profile left exported in the shell: the buckets live in the photos account.
export AWS_PROFILE=photos ROOT

exif=$(mktemp)
trap 'rm -f "$exif"' EXIT
cd "$ROOT/edited"
# exiftool exits 1 when a single file fails; the others are still in the output.
exiftool -q -j -n -r -i HIDDEN -ext jpg -ext jpeg -ext png -ext heic -ext tif -ext tiff \
  -Make -Model -LensModel -FocalLength -FocalLengthIn35mmFormat -FNumber -ExposureTime -ISO -DateTimeOriginal \
  . > "$exif" || [[ -s $exif ]]

counts=$(node - "$exif" << 'JS'
const { existsSync, readFileSync, renameSync, statSync, utimesSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const meta = join(process.env.ROOT, 'web/meta');
let updated = 0;
let unchanged = 0;
let noMeta = 0;
for (const { SourceFile, ...tags } of JSON.parse(readFileSync(process.argv[2], 'utf8'))) {
  const file = join(meta, `${SourceFile.replace(/^\.\//, '').replace(/\.[^./]+$/, '')}.json`);
  if (!existsSync(file)) {
    noMeta++;
    continue;
  }
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (Object.entries(tags).every(([tag, value]) => data.exif?.[tag] === value)) {
    unchanged++;
    continue;
  }
  data.exif = { ...data.exif, ...tags };
  // Keep the mtime: derive.sh rebuilds a photo whose source is newer than its meta.
  const { atime, mtime } = statSync(file);
  writeFileSync(`${file}.tmp`, `${JSON.stringify(data)}\n`);
  renameSync(`${file}.tmp`, file);
  utimesSync(file, atime, mtime);
  updated++;
}
console.log(`photos=${updated + unchanged + noMeta}\tupdated=${updated}\tunchanged=${unchanged}\tno-meta=${noMeta}`);
JS
)
echo "$counts"

aws s3 sync "$ROOT/web/meta" "s3://$BUCKET/web/meta" --only-show-errors
node "$here/catalog.mjs"

printf '%s\tBACKFILL-EXIF\t%s\n' "$(date -u +%FT%TZ)" "$counts" | tee -a "$ROOT/report.tsv"
