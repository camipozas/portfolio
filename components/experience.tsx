import Image from 'next/image';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export function Experience({ content }: { content: Content }) {
  const { experiences } = content;

  return (
    <Section heading={headingFor(content, 'experience')} id="experience">
      <div className="space-y-4">
        {experiences.map((exp, i) => (
          <AnimateOnScroll delay={i * 100} key={exp.company}>
            <div className="gradient-border-hover p-4">
              <div className="flex gap-3">
                {exp.logo && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      alt={`${exp.company} logo`}
                      className="h-full w-full object-cover"
                      height={40}
                      src={exp.logo}
                      unoptimized
                      width={40}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{exp.role}</p>
                      <p className="text-muted text-sm">{exp.company}</p>
                    </div>
                    <p className="text-muted shrink-0 text-sm">{exp.date}</p>
                  </div>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    {exp.description}
                  </p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((bullet) => (
                        <li className="text-muted text-sm" key={bullet}>
                          — {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
