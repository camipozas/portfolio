#!/usr/bin/env bash
# Publishable versions of every backed-up photo, uploaded to the backup bucket (web/).
#   AWS_PROFILE=photos scripts/photos/derive.sh ["<album>"]
# full/1200/2048 carry the watermark, thumb does not; no image keeps any metadata.
set -euo pipefail

ROOT=${ROOT:-$HOME/Pictures/lightroom-backup}
BUCKET=${BUCKET:-camipg-photos-backup-326733328768}
export ROOT WATERMARK="© Camila Pozas · camipg.com"
export FONT=${FONT:-/System/Library/Fonts/Helvetica.ttc}

mark() { # mark <in> <out> <resize|""> <quality>
  local w ps m
  w=$(magick "$1" -auto-orient ${3:+-resize "$3"} -format %w info:)
  ps=$((w * 18 / 1000)) m=$((w * 22 / 1000))
  # White text with a soft shadow so it reads on bright and dark skies alike.
  magick "$1" -auto-orient ${3:+-resize "$3"} -strip -gravity south -font "$FONT" -pointsize "$ps" \
    -fill 'rgba(0,0,0,0.35)' -annotate "+$((ps / 12 + 1))+$((m - ps / 12 - 1))" "$WATERMARK" \
    -fill 'rgba(255,255,255,0.80)' -annotate "+0+$m" "$WATERMARK" \
    -quality "$4" -interlace Plane "$2"
}

one() { # one <album>/<name>
  set -eo pipefail # runs under `bash -c`, which does not inherit set -e
  local src="$ROOT/edited/$1" base="${1%.*}"
  local meta="$ROOT/web/meta/$base.json" web="$ROOT/web"
  local stale=1
  [[ -s $meta && $meta -nt $src ]] && stale=0
  if [[ $stale == 0 && -f $web/1200/$base.jpg ]] && jq -e .color "$meta" > /dev/null; then
    return 0
  fi
  for d in full 2048 1200 thumb meta; do mkdir -p "$(dirname "$web/$d/$base")"; done

  if [[ $stale == 1 ]]; then
    mark "$src" "$web/full/$base.jpg" "" 88
    mark "$src" "$web/2048/$base.jpg" "2048x2048>" 82
    magick "$src" -auto-orient -resize '600x600>' -strip -quality 80 -interlace Plane "$web/thumb/$base.jpg"
  fi
  mark "$src" "$web/1200/$base.jpg" "1200x1200>" 80

  local dims exif color
  dims=$(magick "$web/full/$base.jpg" -format '{"width":%w,"height":%h}' info:)
  exif=$(exiftool -j -n -Make -Model -LensModel -FocalLength -FNumber -ExposureTime -ISO -DateTimeOriginal "$src" \
    | jq -c '.[0] | del(.SourceFile)')
  color=$(magick "$web/thumb/$base.jpg" -resize '1x1!' -format '#%[hex:p{0,0}]' info: | cut -c1-7)
  jq -n -c --argjson d "$dims" --argjson e "$exif" --arg c "$color" '$d + {exif: $e, color: $c}' > "$meta.tmp"
  mv "$meta.tmp" "$meta"
}
export -f mark one

cd "$ROOT/edited"
find "${1:-.}" -type f ! -name '.*' \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.heic' -o -iname '*.tif*' \) \
  | sed 's|^\./||' | tr '\n' '\0' | xargs -0 -n1 -P "${JOBS:-6}" bash -c 'one "$0"'

prefix=${1:+/$1}
aws s3 sync "$ROOT/web/full$prefix" "s3://$BUCKET/web/full$prefix" --storage-class GLACIER_IR --only-show-errors
for d in 2048 1200 thumb meta; do
  aws s3 sync "$ROOT/web/$d$prefix" "s3://$BUCKET/web/$d$prefix" --only-show-errors
done

total=$(find "${1:-.}" -type f ! -name '.*' | wc -l | tr -d ' ')
colored=$(cd "$ROOT/web/meta" && find "${1:-.}" -name '*.json' -exec grep -l '"color"' {} + | wc -l | tr -d ' ')
printf '%s\tDERIVE %s\tphotos=%s\tcolor+1200=%s\n' "$(date -u +%FT%TZ)" "${1:-all}" "$total" "$colored" | tee -a "$ROOT/report.tsv"
