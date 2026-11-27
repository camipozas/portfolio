import { ArrowLeft } from 'lucide-react';
import { Fragment } from 'react';

/** Every crumb but the last (the current page) is a link. */
export function Breadcrumb({
  crumbs,
}: {
  crumbs: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex min-w-0 items-center gap-2">
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.label}>
            {i > 0 && (
              <li aria-hidden="true" className="text-muted">
                /
              </li>
            )}
            {crumb.href ? (
              <li className="shrink-0">
                <a className="group" href={crumb.href}>
                  {/* The global `a { color: inherit }` beats a class on the link itself. */}
                  <span className="text-muted group-hover:text-accent inline-flex items-center gap-1.5 transition-colors">
                    {i === 0 && <ArrowLeft aria-hidden="true" size={16} />}
                    {crumb.label}
                  </span>
                </a>
              </li>
            ) : (
              <li aria-current="page" className="truncate">
                {crumb.label}
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
