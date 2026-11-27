import type * as React from 'react';
import { cn } from '@/lib/utils';

const Separator = ({
  className,
  orientation = 'horizontal',
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
} & { ref?: React.Ref<HTMLDivElement> }) => (
  <div
    className={cn(
      'bg-border shrink-0',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    ref={ref}
    {...props}
  />
);
Separator.displayName = 'Separator';

export { Separator };
