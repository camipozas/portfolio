#!/usr/bin/env bash
# Adds one Lightroom album end to end: backup to S3, web versions, Google Drive, catalog.
#   scripts/photos/add-album.sh ~/Downloads/Roma.zip "Roma 2026"
# Then show it in the backoffice and press Publicar. Safe to re-run: every step skips done work.
set -euo pipefail

usage() {
  echo 'usage: scripts/photos/add-album.sh <zip> "<album>"' >&2
  echo '  e.g. scripts/photos/add-album.sh ~/Downloads/Roma.zip "Roma 2026"' >&2
  exit 1
}
[[ $# -eq 2 && -f $1 && -n $2 ]] || usage
zip=$1 album=${2%/}
here=$(cd "$(dirname "$0")" && pwd)
ROOT=${ROOT:-$HOME/Pictures/lightroom-backup}
# Never a profile left exported in the shell: the buckets live in the photos account.
export AWS_PROFILE=photos ROOT

missing=()
for tool in aws rclone magick exiftool jq node unzip; do
  command -v "$tool" > /dev/null || missing+=("$tool")
done
((${#missing[@]} == 0)) || { echo "missing tools: ${missing[*]}" >&2; exit 1; }
aws sts get-caller-identity > /dev/null || { echo "AWS profile '$AWS_PROFILE' does not work" >&2; exit 1; }
rclone lsd gdrive: --max-depth 1 > /dev/null || { echo "rclone remote 'gdrive' missing or logged out" >&2; exit 1; }

step() { printf '\n== %s/4 %s\n' "$1" "$2"; }
step 1 "backup to S3: $album"
"$here/backup.sh" "$zip" "$album"
step 2 "web versions (watermark, sizes, EXIF)"
# An album made only of photos stored under other albums has nothing new to derive.
if [[ -n $(find "$ROOT/edited/$album" -type f ! -name '.*' -print -quit) ]]; then
  "$here/derive.sh" "$album"
fi
# Catalog before Drive, so a Drive problem does not keep the album out of the backoffice.
step 3 "catalog for the backoffice"
node "$here/catalog.mjs"
step 4 "copy to Google Drive"
"$here/drive.sh"

printf '\nDone. In the backoffice, open "%s", choose what to show and press Publicar.\n' "$album"
