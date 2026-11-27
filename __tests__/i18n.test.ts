import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getContent, headingFor, translator } from '@/lib/content';
import { subtitle } from '@/lib/data';
import { localizedPath } from '@/lib/locale';
import es from '@/lib/translations/es.json';
import { proxy } from '@/proxy';

const TRANSLATED = /^\[/u;

describe('localizedPath', () => {
  it('should keep English without a prefix', () => {
    expect(localizedPath('/', 'en')).toBe('/');
    expect(localizedPath('/es', 'en')).toBe('/');
    expect(localizedPath('/es/pictures', 'en')).toBe('/pictures');
  });

  it('should prefix Spanish with /es', () => {
    expect(localizedPath('/', 'es')).toBe('/es');
    expect(localizedPath('/pictures', 'es')).toBe('/es/pictures');
    expect(localizedPath('/es/pictures', 'es')).toBe('/es/pictures');
  });

  it('should not treat paths that only start with es as Spanish', () => {
    expect(localizedPath('/escape', 'en')).toBe('/escape');
  });
});

describe('getContent', () => {
  it('should fall back to English when a translation is missing', () => {
    expect(translator('es')('Not in the dictionary')).toBe(
      'Not in the dictionary'
    );
    expect(getContent('en').subtitle).toBe(subtitle);
  });

  it('should leave proper names untouched', () => {
    const content = getContent('es', (text) => `[${text}]`);
    expect(content.experiences[0].company).not.toMatch(TRANSLATED);
    expect(content.certifications[0].title).not.toMatch(TRANSLATED);
    expect(content.blogPosts[0].title).not.toMatch(TRANSLATED);
    expect(content.experiences[0].role).toMatch(TRANSLATED);
  });

  it('should have a Spanish translation for every string, and no stale ones', () => {
    const sources = new Set<string>();
    getContent('es', (text) => {
      sources.add(text);
      return text;
    });
    // Add the missing strings to lib/translations/es.json; drop the stale ones.
    expect([...sources].filter((text) => !(text in es))).toEqual([]);
    expect(Object.keys(es).filter((text) => !sources.has(text))).toEqual([]);
  });

  it('should take section headings from the nav labels', () => {
    expect(headingFor(getContent('en'), 'about')).toBe('About');
  });
});

function request(path: string, lang?: string) {
  return new NextRequest(`https://www.camipg.com${path}`, {
    headers: lang ? { cookie: `lang=${lang}` } : {},
  });
}

describe('proxy', () => {
  it('should serve English at / when there is no cookie', () => {
    const response = proxy(request('/'));
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://www.camipg.com/en'
    );
  });

  it('should send a visitor who chose Spanish to /es', () => {
    const response = proxy(request('/', 'es'));
    expect(response.headers.get('location')).toBe('https://www.camipg.com/es');
  });

  it('should keep /es even when the cookie says English', () => {
    const response = proxy(request('/es', 'en'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });

  it('should redirect /en to the unprefixed path', () => {
    const response = proxy(request('/en'));
    expect(response.headers.get('location')).toBe('https://www.camipg.com/');
  });

  it('should store the language picked with ?lang= and drop the param', () => {
    const response = proxy(request('/es?lang=en'));
    expect(response.headers.get('location')).toBe('https://www.camipg.com/');
    expect(response.cookies.get('lang')?.value).toBe('en');
  });

  it('should send the old ?c= collection filter to the collection page', () => {
    expect(proxy(request('/pictures?c=trips')).headers.get('location')).toBe(
      'https://www.camipg.com/pictures/c/trips'
    );
    expect(proxy(request('/es/pictures?c=trips')).headers.get('location')).toBe(
      'https://www.camipg.com/es/pictures/c/trips'
    );
    expect(
      proxy(request('/pictures/berlin?c=trips')).headers.get('location')
    ).toBeNull();
  });

  it('should send an old ?photo= link to the photo page, keeping the language', () => {
    const response = proxy(request('/pictures/berlin?photo=2a56a0edc9837498'));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://www.camipg.com/pictures/berlin/2a56a0edc9837498'
    );
    expect(
      proxy(request('/es/pictures/berlin?photo=abc')).headers.get('location')
    ).toBe('https://www.camipg.com/es/pictures/berlin/abc');
    expect(
      proxy(request('/pictures/c/trips?photo=abc')).headers.get('location')
    ).toBeNull();
  });

  it('should ignore an unknown ?lang= value', () => {
    const response = proxy(request('/?lang=fr'));
    expect(response.cookies.get('lang')).toBeUndefined();
  });
});
