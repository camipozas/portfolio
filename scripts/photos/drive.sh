#!/usr/bin/env bash
# Second copy of the full-size photos in Google Drive ("Lightroom Backup/<album>/").
# Copies only (never deletes on either side), then checks every local file is in
# Drive with the same size and appends the result to $ROOT/report.tsv.
#
#   scripts/photos/drive.sh
#
# Needs an rclone remote `gdrive` with scope drive.file (rclone only sees what it created).
set -euo pipefail

ROOT=${ROOT:-$HOME/Pictures/lightroom-backup}
DEST=${DEST:-gdrive:Lightroom Backup}

rclone copy "$ROOT/edited" "$DEST" --transfers 8 --exclude '.*'

if rclone check "$ROOT/edited" "$DEST" --one-way --size-only --exclude '.*' 2> "$ROOT/drive-check.log"; then
  status=OK
else
  status="FAIL (see drive-check.log)"
fi
count=$(find "$ROOT/edited" -type f ! -name '.*' | wc -l | tr -d ' ')
printf '%s\tDRIVE\tfiles=%s\tdrive=%s\n' "$(date -u +%FT%TZ)" "$count" "$status" | tee -a "$ROOT/report.tsv"
[[ $status == OK ]]
