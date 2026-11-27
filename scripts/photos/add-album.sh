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
zip=$1 album=$2
here=$(cd "$(dirname "$0")" && pwd)
export AWS_PROFILE=${AWS_PROFILE:-photos}

missing=()
for tool in aws rclone magick exiftool jq node unzip; do
  command -v "$tool" > /dev/null || missing+=("$tool")
done
((${#missing[@]} == 0)) || { echo "missing tools: ${missing[*]}" >&2; exit 1; }
aws sts get-caller-identity > /dev/null || { echo "AWS profile '$AWS_PROFILE' does not work" >&2; exit 1; }
rclone listremotes | grep -qx 'gdrive:' || { echo "rclone remote 'gdrive' not found" >&2; exit 1; }

step() { printf '\n== %s/4 %s\n' "$1" "$2"; }
step 1 "backup to S3: $album"
"$here/backup.sh" "$zip" "$album"
step 2 "web versions (watermark, sizes, EXIF)"
"$here/derive.sh" "$album"
step 3 "copy to Google Drive"
"$here/drive.sh"
step 4 "catalog for the backoffice"
node "$here/catalog.mjs"

printf '\nDone. In the backoffice, open "%s", choose what to show and press Publicar.\n' "$album"
