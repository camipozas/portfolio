import { title, subtitle, resumeUrl, heroEmoji, heroIllustration } from "@/lib/data";
import { SocialLinks } from "./social-links";

export function Hero() {
  return (
    <section className="flex items-center gap-12 pt-16 pb-12">
      <div className="flex-1">
        <p className="mb-2 text-lg">{heroEmoji} Hey there!</p>
        <h1 className="gradient-text mb-3 text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mb-6 text-muted">{subtitle}</p>
        <div className="flex items-center gap-6">
          <SocialLinks />
          <a
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="accent-link text-sm"
          >
            Resume
          </a>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroIllustration}
        alt=""
        width={200}
        height={200}
        className="hidden md:block shrink-0"
      />
    </section>
  );
}
