import { Badge } from '@/components/ui/badge';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export function About({ content }: { content: Content }) {
  const { bio, skillCategories } = content;

  return (
    <Section heading={headingFor(content, 'about')} id="about">
      <p className="text-muted mb-6 leading-relaxed">{bio}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {skillCategories.map((category, i) => (
          <AnimateOnScroll
            className={category.size === 'large' ? 'sm:col-span-2' : ''}
            delay={i * 100}
            key={category.label}
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
