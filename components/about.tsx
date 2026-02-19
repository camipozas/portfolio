import { bio, skillCategories } from "@/lib/data";
import { Section } from "./section";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "./animate-on-scroll";

export function About() {
  return (
    <Section id="about" heading="About">
      <p className="mb-6 text-muted leading-relaxed">{bio}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {skillCategories.map((category, i) => (
          <AnimateOnScroll
            key={category.label}
            delay={i * 100}
            className={category.size === "large" ? "sm:col-span-2" : ""}
          >
            <div className="gradient-border-hover p-4">
              <p className="mb-2 text-sm font-medium">
                <span className="mr-1">{category.emoji}</span>
                {category.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
