import { ExternalLink } from "lucide-react";
import { blogPosts } from "@/lib/data";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export function Writing() {
  return (
    <Section id="writing" heading="Writing">
      <p className="mb-6 text-muted leading-relaxed">
        Sometimes I like to write and share some things that I&apos;ve learned.
      </p>
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
