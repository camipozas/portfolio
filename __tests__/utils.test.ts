import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it.each([
    [false, 'base visible'],
    [true, 'base hidden visible'],
  ])('handles conditional classes (hidden=%s)', (hidden, expected) => {
    expect(cn('base', hidden && 'hidden', 'visible')).toBe(expected);
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});
