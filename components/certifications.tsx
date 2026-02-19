import { ExternalLink } from "lucide-react";
import { certifications } from "@/lib/data";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export function Certifications() {
  return (
    <Section id="certifications" heading="Certifications">
      <div className="space-y-4">
        {certifications.map((cert, i) => (
          <AnimateOnScroll key={cert.title} delay={i * 100}>
            <a
              href={cert.credlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border-hover flex items-start justify-between gap-4 p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {cert.emoji && <span className="mr-1">{cert.emoji}</span>}
                  {cert.title}
                </p>
                <p className="text-sm text-muted">{cert.subtitle}</p>
              </div>
              <ExternalLink size={14} className="mt-0.5 shrink-0 text-muted" />
            </a>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
