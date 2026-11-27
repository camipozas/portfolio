import { ExternalLink } from 'lucide-react';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export function Writing({ content }: { content: Content }) {
  const { blogPosts, ui } = content;

  return (
    <Section heading={headingFor(content, 'writing')} id="writing">
      <p className="text-muted mb-6 leading-relaxed">{ui.writingIntro}</p>
      <div className="space-y-4">
        {blogPosts.map((post, i) => (
          <AnimateOnScroll delay={i * 100} key={post.url}>
            <a
              className="gradient-border-hover flex items-start justify-between gap-4 p-4"
              href={post.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div>
                <p className="text-sm font-medium">{post.title}</p>
                <p className="text-muted mt-1 text-sm">{post.description}</p>
              </div>
              <ExternalLink className="text-muted mt-0.5 shrink-0" size={14} />
            </a>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
