#!/usr/bin/env bash
# Backs up one Lightroom web download (zip of "Full Size" photos) to S3 under its album path.
#   AWS_PROFILE=photos scripts/photos/backup.sh <zip> "<folder/album>"
# Same photo in several albums (same SHA-256) is stored once; see duplicates.tsv. Never deletes.
set -euo pipefail

zip=${1:?zip path}
album=${2:?album path, e.g. "Amsterdam" or "BKT/Album"}
ROOT=${ROOT:-$HOME/Pictures/lightroom-backup}
BUCKET=${BUCKET:-camipg-photos-backup-326733328768}

[[ $album == /* || $album == *..* ]] && { echo "album must be a relative path" >&2; exit 1; }
mkdir -p "$ROOT/edited/$album"
touch "$ROOT/index.tsv" "$ROOT/duplicates.tsv" "$ROOT/report.tsv"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
unzip -q "$zip" -d "$tmp"

new=0 dup=0
while IFS= read -r -d '' f; do
  name=$(basename "$f")
  name=${name#[0-9]*-} # Lightroom prefixes each file with its position: "12-DSC00042.jpg"
  sha=$(shasum -a 256 "$f" | cut -d' ' -f1)

  if first=$(grep -m1 "^$sha	" "$ROOT/index.tsv"); then
    printf '%s\t%s\t%s\n' "$sha" "${first#*	}" "$album/$name" >> "$ROOT/duplicates.tsv"
    dup=$((dup + 1))
    continue
  fi

  # Camera counters restart, so two different photos can share a name in one album.
  [[ -e "$ROOT/edited/$album/$name" ]] && name="${name%.*}-${sha:0:8}.${name##*.}"
  mv "$f" "$ROOT/edited/$album/$name"
  printf '%s\t%s\n' "$sha" "$album/$name" >> "$ROOT/index.tsv"
  new=$((new + 1))
done < <(find "$tmp" -type f ! -name '.*' -print0)

aws s3 sync "$ROOT/edited/$album/" "s3://$BUCKET/edited/$album/" --storage-class GLACIER_IR --only-show-errors

local_list=$(cd "$ROOT/edited/$album" && find . -maxdepth 1 -type f ! -name '.*' -exec stat -f '%N	%z' {} + | sed 's|^\./||' | sort)
s3_list=$(aws s3api list-objects-v2 --bucket "$BUCKET" --prefix "edited/$album/" \
  --query 'Contents[].[Key,Size]' --output text | awk -F'\t' -v p="edited/$album/" \
  '{k=substr($1, length(p)+1); if (k !~ /\//) print k "\t" $2}' | sort)
missing=$(comm -23 <(echo "$local_list") <(echo "$s3_list") | grep -c . || true)

status=OK
[[ $missing -gt 0 ]] && status="FAIL ($missing missing in S3)"
count=$(echo "$local_list" | grep -c . || true)
printf '%s\t%s\tnew=%s\tdup=%s\tfiles=%s\ts3=%s\n' "$(date -u +%FT%TZ)" "$album" "$new" "$dup" "$count" "$status" | tee -a "$ROOT/report.tsv"
[[ $status == OK ]]
