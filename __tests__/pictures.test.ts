import { describe, expect, it } from 'vitest';
import {
  formatCamera,
  formatDateRange,
  formatExposure,
  formatSettings,
  formatTakenAt,
} from '@/lib/pictures/exif';
import {
  aboveWatermark,
  localized,
  parseAlbums,
  parseCollections,
} from '@/lib/pictures/manifest';

describe('exif formatting', () => {
  it('should show fast shutter speeds as fractions and slow ones in seconds', () => {
    expect(formatExposure(0.001_052_631_579)).toBe('1/950s');
    expect(formatExposure(1 / 250)).toBe('1/250s');
    expect(formatExposure(2.5)).toBe('2.5s');
  });

  it('should not repeat the brand already in the model', () => {
    expect(formatCamera({ make: 'Canon', model: 'Canon EOS R6' })).toBe(
      'Canon EOS R6'
    );
    expect(formatCamera({ make: 'SONY', model: 'ILCE-7M4' })).toBe(
      'SONY ILCE-7M4'
    );
    expect(formatCamera({ model: 'iPhone 13 Pro' })).toBe('iPhone 13 Pro');
  });

  it('should join only the settings the photo has', () => {
    expect(
      formatSettings({
        fNumber: 1.8,
        exposureTime: 1 / 950,
        iso: 32,
        focalLength: 1.57,
      })
    ).toBe('ƒ/1.8 · 1/950s · ISO 32 · 1.6mm');
    expect(formatSettings({ iso: 100 })).toBe('ISO 100');
    expect(formatSettings({})).toBe('');
  });

  it('should format the capture date in the page language, ignoring the time zone', () => {
    expect(formatTakenAt('2023:08:05 15:36:24', 'en')).toBe('August 5, 2023');
    expect(formatTakenAt('2023:08:05 15:36:24', 'es')).toBe(
      '5 de agosto de 2023'
    );
    expect(formatTakenAt('not a date', 'en')).toBeUndefined();
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

describe('aboveWatermark', () => {
  it('should trim more of a wide photo, since the watermark scales with the width', () => {
    expect(aboveWatermark({ width: 1600, height: 900 })).toBeCloseTo(0.911, 3);
    expect(aboveWatermark({ width: 800, height: 1200 })).toBeCloseTo(0.967, 3);
  });
});
