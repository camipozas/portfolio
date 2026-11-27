// photos/manifest.json: written by the backoffice, only what is published, in order.
// Images: `${CLOUDFRONT_BASE}/photos/p/<id>/{thumb,2048,full}.jpg`.

/** Spanish falls back to English. */
export interface Localized {
  en: string;
  es?: string;
}

export interface PhotoExif {
  make?: string;
  model?: string;
  lens?: string;
  focalLength?: number;
  fNumber?: number;
  exposureTime?: number;
  iso?: number;
  /** EXIF format "YYYY:MM:DD HH:MM:SS" */
  takenAt?: string;
}

export interface Photo {
  id: string;
  /** Of the full image; reserves the space before it loads. */
  width: number;
  height: number;
  /** Dominant colour, shown while the image loads. */
  color?: string;
  alt?: Localized;
  exif?: PhotoExif;
}

export interface Collection {
  slug: string;
  title: Localized;
}

export interface Album {
  slug: string;
  title: Localized;
  coverId: string;
  photos: Photo[];
  /** Slug of one of the manifest's collections. */
  collection?: string;
}

export interface Manifest {
  version: 1;
  generatedAt: string;
  albums: Album[];
  /** Display order; only those with a published album. */
  collections?: Collection[];
}
