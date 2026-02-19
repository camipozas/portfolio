import Image from "next/image";
import { education } from "@/lib/data";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export function EducationSection() {
  return (
    <Section id="education" heading="Education">
      <div className="space-y-4">
        {education.map((edu, i) => (
          <AnimateOnScroll key={edu.school} delay={i * 100}>
            <div className="gradient-border-hover p-4">
              <div className="flex gap-3">
                {edu.logo && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={edu.logo}
                      alt={`${edu.school} logo`}
                      width={40}
                      height={40}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">{edu.degree}</p>
                      <p className="text-sm text-muted">{edu.school}</p>
                    </div>
                    <p className="text-sm text-muted shrink-0">
                      {edu.duration}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {edu.description}
                  </p>
                  {edu.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {edu.bullets.map((bullet) => (
                        <li key={bullet} className="text-sm text-muted">
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
