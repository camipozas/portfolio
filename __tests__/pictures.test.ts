import { describe, expect, it } from 'vitest';
import {
  exposureSpecs,
  formatCamera,
  formatDateRange,
  formatExposure,
  formatLens,
  formatTakenAt,
} from '@/lib/pictures/exif';
import { justifyRows } from '@/lib/pictures/justify';
import {
  aboveWatermark,
  albumsIn,
  localized,
  mosaicPhotos,
  parseAlbums,
  parseCollections,
} from '@/lib/pictures/manifest';
import type { Album } from '@/lib/pictures/types';

describe('exif formatting', () => {
  it('should show fast shutter speeds as fractions and slow ones in seconds', () => {
    expect(formatExposure(0.001_052_631_579)).toBe('1/950 s');
    expect(formatExposure(1 / 250)).toBe('1/250 s');
    expect(formatExposure(2.5)).toBe('2.5 s');
    expect(formatExposure(0.8)).toBe('0.8 s');
  });

  it('should name cameras the way people know them', () => {
    expect(formatCamera({ make: 'SONY', model: 'ILCE-6400' })).toBe(
      'Sony α6400'
    );
    expect(formatCamera({ make: 'SONY', model: 'ILCE-7RM5' })).toBe(
      'Sony α7R V'
    );
    expect(formatCamera({ make: 'SONY', model: 'ILCE-7M3' })).toBe(
      'Sony α7 III'
    );
    expect(
      formatCamera({ make: 'NIKON CORPORATION', model: 'NIKON D5100' })
    ).toBe('Nikon D5100');
    expect(formatCamera({ make: 'Canon', model: 'Canon EOS R6' })).toBe(
      'Canon EOS R6'
    );
    expect(formatCamera({ make: 'Apple', model: 'iPhone 16 Pro' })).toBe(
      'iPhone 16 Pro'
    );
    expect(formatCamera({ make: 'Google', model: 'Pixel 7' })).toBe('Pixel 7');
    expect(formatCamera({ make: 'DJI', model: 'AC004' })).toBe('DJI AC004');
    expect(formatCamera({ make: 'samsung', model: 'SM-S918B' })).toBe(
      'Samsung SM-S918B'
    );
    expect(formatCamera({ make: 'SONY', model: 'ILCE-7M8' })).toBe(
      'Sony ILCE-7M8'
    );
    expect(formatCamera({})).toBeUndefined();
  });

  it('should drop a phone lens that only repeats the model and tidy the rest', () => {
    expect(
      formatLens({
        model: 'iPhone 16 Pro',
        lens: 'iPhone 16 Pro back triple camera 6.765mm f/1.78',
      })
    ).toBeUndefined();
    expect(
      formatLens({ model: 'ILCE-6400', lens: 'E 55-210mm F4.5-6.3 OSS' })
    ).toBe('E 55-210mm F4.5-6.3 OSS');
    expect(
      formatLens({ model: 'NIKON D5100', lens: '70.0-300.0 mm f/4.5-5.6' })
    ).toBe('70-300 mm f/4.5-5.6');
    expect(formatLens({ lens: '18.0-55.0mm f/3.5-5.6' })).toBe(
      '18-55mm f/3.5-5.6'
    );
  });

  it('should list only the exposure settings the photo has, in order', () => {
    expect(
      exposureSpecs({
        focalLength: 94,
        iso: 400,
        exposureTime: 1 / 160,
        fNumber: 5.6,
      })
    ).toEqual([
      { spec: 'aperture', value: 'ƒ/5.6' },
      { spec: 'shutter', value: '1/160 s' },
      { spec: 'iso', value: '400' },
      { spec: 'focalLength', value: '94 mm' },
    ]);
    expect(exposureSpecs({ iso: 100 })).toEqual([
      { spec: 'iso', value: '100' },
    ]);
    expect(exposureSpecs({})).toEqual([]);
  });

  it('should show a phone its 35 mm-equivalent focal length when it has one', () => {
    const iphone = {
      make: 'Apple',
      model: 'iPhone 16 Pro',
      focalLength: 6.765,
    };
    expect(exposureSpecs({ ...iphone, focalLength35: 24 })).toEqual([
      { spec: 'focalLength', value: '24 mm eq.' },
    ]);
    expect(exposureSpecs(iphone)).toEqual([
      { spec: 'focalLength', value: '6.8 mm' },
    ]);
    // No lens model and a code for a model, as many Android phones write.
    expect(
      exposureSpecs({
        make: 'Xiaomi',
        model: '2201123G',
        focalLength: 5.4,
        focalLength35: 26,
      })
    ).toEqual([{ spec: 'focalLength', value: '26 mm eq.' }]);
  });

  it('should keep the real focal length for cameras', () => {
    expect(
      exposureSpecs({
        make: 'SONY',
        model: 'ILCE-6400',
        lens: 'E 55-210mm F4.5-6.3 OSS',
        focalLength: 55,
        focalLength35: 82,
      })
    ).toEqual([{ spec: 'focalLength', value: '55 mm' }]);
    // A 1" compact (crop 2.7) is not a phone either.
    expect(
      exposureSpecs({ model: 'DSC-RX100M7', focalLength: 9, focalLength35: 24 })
    ).toEqual([{ spec: 'focalLength', value: '9 mm' }]);
  });

  it('should format the capture date and time in the page language, ignoring the time zone', () => {
    expect(formatTakenAt('2023:08:05 15:36:24', 'en')).toBe(
      'August 5, 2023 at 3:36 PM'
    );
    expect(formatTakenAt('2023:08:05 15:36:24', 'es')).toBe(
      '5 de agosto de 2023 a las 15:36'
    );
    expect(formatTakenAt('2023:08:05', 'en')).toBe('August 5, 2023');
    expect(formatTakenAt('not a date', 'en')).toBeUndefined();
    expect(formatTakenAt('0000:00:00 00:00:00', 'en')).toBeUndefined();
    expect(formatTakenAt('2023:08:05 25:99:00', 'en')).toBeUndefined();
  });
});

describe('manifest', () => {
  const photo = { id: 'a1', width: 6000, height: 4000 };

  it('should drop albums without photos', () => {
    const albums = parseAlbums({
      version: 1,
      generatedAt: '2026-11-27T00:00:00Z',
      albums: [
        { slug: 'roma', title: { en: 'Rome' }, coverId: 'a1', photos: [photo] },
        { slug: 'empty', title: { en: 'Empty' }, coverId: 'a1', photos: [] },
      ],
    });
    expect(albums.map((album) => album.slug)).toEqual(['roma']);
  });

  it('should treat a malformed manifest as nothing published', () => {
    expect(parseAlbums(null)).toEqual([]);
    expect(parseAlbums({ albums: 'nope' })).toEqual([]);
  });

  it('should read collections and find none in a manifest published before them', () => {
    const trips = { slug: 'trips', title: { en: 'Trips' } };
    expect(parseCollections({ albums: [], collections: [trips] })).toEqual([
      trips,
    ]);
    expect(parseCollections({ albums: [] })).toEqual([]);
    expect(parseCollections(null)).toEqual([]);
  });

  it('should fall back to English when the Spanish text is missing', () => {
    expect(localized({ en: 'Rome', es: 'Roma' }, 'es')).toBe('Roma');
    expect(localized({ en: 'Rome' }, 'es')).toBe('Rome');
    expect(localized(undefined, 'en')).toBe('');
    // Captions may be written only in Spanish.
    expect(localized({ en: '', es: 'Casco antiguo' }, 'en')).toBe(
      'Casco antiguo'
    );
  });
});

describe('formatDateRange', () => {
  it('should show one month, a range within a year and across years', () => {
    expect(
      formatDateRange(['2025:05:03 10:00:00', '2025:05:20 10:00:00'], 'en')
    ).toBe('May 2025');
    expect(
      formatDateRange(['2025:05:03 10:00:00', '2025:04:20 10:00:00'], 'en')
    ).toBe('Apr – May 2025');
    expect(
      formatDateRange(['2024:12:30 10:00:00', '2025:01:02 10:00:00'], 'en')
    ).toBe('Dec 2024 – Jan 2025');
  });

  it('should ignore photos without a date and return nothing when none has one', () => {
    expect(formatDateRange([undefined, '2025:05:03 10:00:00'], 'en')).toBe(
      'May 2025'
    );
    expect(formatDateRange([undefined], 'en')).toBeUndefined();
  });
});

const makeAlbum = (
  slug: string,
  ids: string[],
  collection?: string
): Album => ({
  slug,
  title: { en: slug },
  coverId: ids.at(-1) as string,
  photos: ids.map((id) => ({ id, width: 3, height: 2 })),
  collection,
});

describe('collections', () => {
  const trips = [makeAlbum('a', ['a1', 'a2']), makeAlbum('b', ['b1'])].map(
    (a) => ({
      ...a,
      collection: 'trips',
    })
  );
  const albums = [
    ...trips,
    makeAlbum('kira', ['k1']),
    makeAlbum('lost', ['l1'], 'gone'),
  ];

  it('should list the albums of a collection, and those of none or an unknown one apart', () => {
    const collections = [{ slug: 'trips', title: { en: 'Trips' } }];
    expect(albumsIn(albums, collections, 'trips')).toEqual(trips);
    expect(albumsIn(albums, collections).map((a) => a.slug)).toEqual([
      'kira',
      'lost',
    ]);
  });

  it('should lead the mosaic with the chosen album, then the other covers', () => {
    expect(mosaicPhotos(trips, 'b').map((p) => p.id)).toEqual(['b1', 'a2']);
    expect(mosaicPhotos(trips).map((p) => p.id)).toEqual(['a2', 'b1', 'a1']);
    expect(mosaicPhotos(trips, 'gone')[0].id).toBe('a2');
  });

  it('should fill the mosaic of a one-album collection with more of its photos', () => {
    expect(
      mosaicPhotos([makeAlbum('x', ['1', '2', '3', '4'])]).map((p) => p.id)
    ).toEqual(['4', '1', '2']);
    expect(mosaicPhotos([])).toEqual([]);
  });
});

describe('aboveWatermark', () => {
  it('should trim more of a wide photo, since the watermark scales with the width', () => {
    expect(aboveWatermark({ width: 1600, height: 900 })).toBeCloseTo(0.911, 3);
    expect(aboveWatermark({ width: 800, height: 1200 })).toBeCloseTo(0.967, 3);
  });
});

describe('justifyRows', () => {
  it('should put two 16:9 photos per row on a phone instead of one', () => {
    const rows = justifyRows([1.95, 1.95, 1.95, 1.95], 326, 120, 6);
    expect(rows.map((r) => r.end - r.start)).toEqual([2, 2]);
    expect(rows[0].height).toBeCloseTo((326 - 6) / 3.9);
  });

  it('should pick the photo count whose height is closest to the target', () => {
    const rows = justifyRows(new Array(8).fill(0.6), 326, 120, 6);
    expect(rows.map((r) => r.end - r.start)).toEqual([4, 4]);
  });

  it('should fill the width exactly on every full row', () => {
    const ratios = [1.5, 0.67, 1.78, 1, 0.56, 1.5, 2.4, 0.75];
    for (const row of justifyRows(ratios, 1100, 240, 8).slice(0, -1)) {
      const widths = ratios
        .slice(row.start, row.end)
        .reduce((sum, r) => sum + r * row.height, 0);
      expect(widths + 8 * (row.end - row.start - 1)).toBeCloseTo(1100);
    }
  });

  it('should not stretch a short last row', () => {
    const rows = justifyRows([1.5, 1.5, 1.5, 0.67], 1100, 240, 8);
    expect(rows.at(-1)?.height).toBe(240);
  });

  it('should cover every photo once, in order, and handle an empty album', () => {
    const rows = justifyRows([1, 2, 0.5, 1.5, 1, 0.7, 2.4], 400, 150, 4);
    expect(rows[0].start).toBe(0);
    for (const [i, row] of rows.entries()) {
      expect(row.end).toBeGreaterThan(row.start);
      expect(row.start).toBe(i === 0 ? 0 : rows[i - 1].end);
    }
    expect(rows.at(-1)?.end).toBe(7);
    expect(justifyRows([], 400, 150, 4)).toEqual([]);
  });

  it('should mark only a short last row as not filling the width', () => {
    expect(
      justifyRows([1.95, 1.95, 1.95, 1.95], 326, 120, 6).map((r) => r.fills)
    ).toEqual([true, true]);
    expect(justifyRows([1.5, 1.5, 1.5, 0.67], 1100, 240, 8).at(-1)?.fills).toBe(
      false
    );
  });
});
