import Image from "next/image";
import { experiences } from "@/lib/data";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export function Experience() {
  return (
    <Section id="experience" heading="Experience">
      <div className="space-y-4">
        {experiences.map((exp, i) => (
          <AnimateOnScroll key={exp.company} delay={i * 100}>
            <div className="gradient-border-hover p-4">
              <div className="flex gap-3">
                {exp.logo && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={exp.logo}
                      alt={`${exp.company} logo`}
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
                      <p className="text-sm font-medium">{exp.role}</p>
                      <p className="text-sm text-muted">{exp.company}</p>
                    </div>
                    <p className="text-sm text-muted shrink-0">{exp.date}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {exp.description}
                  </p>
                  {exp.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.map((bullet) => (
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
