import { ExternalLink } from "lucide-react";
import { type Content, headingFor } from "@/lib/content";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export function Writing({ content }: { content: Content }) {
  const { blogPosts, ui } = content;

  return (
    <Section id="writing" heading={headingFor(content, "writing")}>
      <p className="mb-6 text-muted leading-relaxed">{ui.writingIntro}</p>
      <div className="space-y-4">
        {blogPosts.map((post, i) => (
          <AnimateOnScroll key={post.url} delay={i * 100}>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border-hover flex items-start justify-between gap-4 p-4"
            >
              <div>
                <p className="text-sm font-medium">{post.title}</p>
                <p className="mt-1 text-sm text-muted">{post.description}</p>
              </div>
              <ExternalLink size={14} className="mt-0.5 shrink-0 text-muted" />
            </a>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
