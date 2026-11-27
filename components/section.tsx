import { sectionEmojis } from '@/lib/data';
import { AnimateOnScroll } from './animate-on-scroll';

interface SectionProps {
  id: string;
  heading: string;
  children: React.ReactNode;
}

export function Section({ id, heading, children }: SectionProps) {
  const emoji = sectionEmojis[id];

  return (
    <section className="py-12" id={id}>
      <AnimateOnScroll>
        <h2 className="mb-8 text-lg font-medium">
          {Boolean(emoji) && <span className="mr-2">{emoji}</span>}
          {heading}
        </h2>
      </AnimateOnScroll>
      {children}
    </section>
  );
}
