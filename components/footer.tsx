import { Separator } from "@/components/ui/separator";
import { name, socialLinks } from "@/lib/data";
import { SocialLinks } from "./social-links";

export function Footer() {
  return (
    <footer className="py-12">
      <Separator className="mb-8" />
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted">
          ☕ Want to chat?{" "}
          <a href={`mailto:${socialLinks.email}`} className="accent-link">
            Send me an email
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
