import { Separator } from "@/components/ui/separator";
import type { Content } from "@/lib/content";
import { name, socialLinks } from "@/lib/data";
import { SocialLinks } from "./social-links";

export function Footer({ content }: { content: Content }) {
  const { ui } = content;

  return (
    <footer className="py-12">
      <Separator className="mb-8" />
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted">
          ☕ {ui.chat}{" "}
          <a href={`mailto:${socialLinks.email}`} className="accent-link">
            {ui.sendEmail}
          </a>
          .
        </p>
        <SocialLinks />
        <p className="text-xs text-muted">
          {new Date().getFullYear()} {name}
        </p>
      </div>
    </footer>
  );
}
