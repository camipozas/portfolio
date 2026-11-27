'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Section {
  /** Undefined for the albums outside every collection. */
  slug?: string;
  title: string;
  content: ReactNode;
}

interface CollectionSectionsProps {
  label: string;
  allLabel: string;
  href: string;
  sections: Section[];
  active?: string | null;
}

/** Chips link to `?c=<slug>`, which shows only that collection. */
export function CollectionSections({
  label,
  allLabel,
  href,
  sections,
  active,
}: CollectionSectionsProps) {
  const current = sections.find((s) => s.slug && s.slug === active)?.slug;
  const chips = [
    { slug: undefined, title: allLabel },
    ...sections.filter((s) => s.slug),
  ];
  return (
    <>
      <nav aria-label={label} className="mt-8 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            aria-current={chip.slug === current ? 'page' : undefined}
            className={cn(
              'border-border rounded-full border px-3 py-1 text-sm',
              chip.slug === current ? 'bg-foreground' : 'hover:text-accent'
            )}
            href={chip.slug ? `${href}?c=${chip.slug}` : href}
            key={chip.slug ?? ''}
            scroll={false}
          >
            {/* The global `a { color: inherit }` beats a class on the link itself. */}
            <span className={cn(chip.slug === current && 'text-background')}>
              {chip.title}
            </span>
          </Link>
        ))}
      </nav>
      {sections
        .filter((s) => !current || s.slug === current)
        .map((s) => (
          <section className="mt-10" key={s.slug ?? ''}>
            <h2 className="mb-4 text-lg font-semibold">{s.title}</h2>
            {s.content}
          </section>
        ))}
    </>
  );
}

/** Reads the filter on the client so the page stays prerendered. */
export function FilteredCollectionSections(
  props: Omit<CollectionSectionsProps, 'active'>
) {
  return <CollectionSections {...props} active={useSearchParams().get('c')} />;
}
