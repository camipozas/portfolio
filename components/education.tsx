import Image from 'next/image';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export function EducationSection({ content }: { content: Content }) {
  const { education } = content;

  return (
    <Section heading={headingFor(content, 'education')} id="education">
      <div className="space-y-4">
        {education.map((edu, i) => (
          <AnimateOnScroll delay={i * 100} key={edu.school}>
            <div className="gradient-border-hover p-4">
              <div className="flex gap-3">
                {!!edu.logo && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      alt={`${edu.school} logo`}
                      className="h-full w-full object-cover"
                      height={40}
                      src={edu.logo}
                      unoptimized
                      width={40}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{edu.degree}</p>
                      <p className="text-muted text-sm">{edu.school}</p>
                    </div>
                    <p className="text-muted shrink-0 text-sm">
                      {edu.duration}
                    </p>
                  </div>
                  <p className="text-muted mt-2 text-sm leading-relaxed">
                    {edu.description}
                  </p>
                  {edu.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {edu.bullets.map((bullet) => (
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
