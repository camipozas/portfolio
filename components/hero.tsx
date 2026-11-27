import type { Content } from '@/lib/content';
import { heroEmoji, heroIllustration, resumeUrl } from '@/lib/data';
import { SocialLinks } from './social-links';

export function Hero({ content }: { content: Content }) {
  const { title, subtitle, ui } = content;

  return (
    <section className="flex items-center gap-12 pt-16 pb-12">
      <div className="flex-1">
        <p className="mb-2 text-lg">
          {heroEmoji} {ui.greeting}
        </p>
        <h1 className="gradient-text mb-3 text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted mb-6">{subtitle}</p>
        <div className="flex items-center gap-6">
          <SocialLinks />
          <a
            className="accent-link text-sm"
            href={resumeUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {ui.resume}
          </a>
        </div>
      </div>
      {/* biome-ignore lint/performance/noImgElement: remote SVG not supported by next/image */}
      <img
        alt=""
        className="hidden shrink-0 md:block"
        height={200}
        src={heroIllustration}
        width={200}
      />
    </section>
  );
}
