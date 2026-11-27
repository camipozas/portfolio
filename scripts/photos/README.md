# Photo backup

Local scripts that back up the Lightroom library to S3 and Google Drive and build
the web versions and the catalog for the backoffice. Run them by hand
on a Mac; nothing here runs in CI or on Vercel.

## New album

1. In Lightroom web, open the album, select all and download as **Full Size**.
2. `scripts/photos/add-album.sh ~/Downloads/<album>.zip "<album>"` runs backup,
   derive, catalog and Drive (steps 2, 3, 5, 4 below), with progress, and stops
   at the first failure. Safe to re-run.
3. In the backoffice, open the album, choose what to show and press Publicar.

Run it on the Mac that holds `~/Pictures/lightroom-backup`: the catalog is
rebuilt from its `index.tsv`.

## Order (what add-album.sh runs)

1. In Lightroom web, download each album as **Full Size** (edits applied, zip).
2. `AWS_PROFILE=photos scripts/photos/backup.sh <zip> "<folder/album>"`: stores the
   originals under the album path and uploads them to `edited/`, then checks every
   file landed in S3.
3. `AWS_PROFILE=photos scripts/photos/derive.sh ["<album>"]`: builds `full`, `2048`,
   `1200` (watermarked) and a 600 px `thumb`, plus `meta/*.json` (size, EXIF,
   average colour), and uploads them to `web/`. Skips photos already derived.
4. `scripts/photos/drive.sh`: copies the originals to Google Drive
   (`Lightroom Backup/<album>/`) and checks them.
5. `AWS_PROFILE=photos node scripts/photos/catalog.mjs`: writes
   `curation/catalog.json` (every photo, by album) for the backoffice.

Each run appends one line to `report.tsv`.

## Tools

- AWS CLI with the `photos` profile
- rclone with a remote named `gdrive` (scope `drive.file`, so it only sees what it created)
- ImageMagick (`magick`), exiftool, jq, Node

## Where data lives

- Local: `~/Pictures/lightroom-backup` (`edited/`, `web/`, `index.tsv`,
  `duplicates.tsv`, `report.tsv`); override with `ROOT`.
- S3: `camipg-photos-backup-326733328768` (override with `BUCKET`)
  - `edited/`: originals, Glacier Instant Retrieval
  - `web/{full,2048,1200,thumb,meta}/`: published versions (`full` in Glacier IR)
  - `curation/catalog.json`
- Google Drive: `Lightroom Backup/`

## Guarantees

- Never deletes, locally or remotely.
- A photo found in several albums (same SHA-256) is stored once and listed in
  `duplicates.tsv`; the catalog still shows it in every album.
- Every web version is stripped of metadata (GPS, camera serials, XMP).
- `full`, `2048` and `1200` carry the watermark; `thumb` does not.
