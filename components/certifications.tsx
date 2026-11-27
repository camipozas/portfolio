import { ExternalLink } from 'lucide-react';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export function Certifications({ content }: { content: Content }) {
  const { certifications } = content;

  return (
    <Section
      heading={headingFor(content, 'certifications')}
      id="certifications"
    >
      <div className="space-y-4">
        {certifications.map((cert, i) => (
          <AnimateOnScroll delay={i * 100} key={cert.title}>
            <a
              className="gradient-border-hover flex items-start justify-between gap-4 p-4"
              href={cert.credlyUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div>
                <p className="text-sm font-medium">
                  {cert.emoji && <span className="mr-1">{cert.emoji}</span>}
                  {cert.title}
                </p>
                <p className="text-muted text-sm">{cert.subtitle}</p>
              </div>
              <ExternalLink className="text-muted mt-0.5 shrink-0" size={14} />
            </a>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
