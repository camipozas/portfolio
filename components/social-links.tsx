import { Github, Linkedin, Mail, BookOpen } from "lucide-react";
import { socialLinks } from "@/lib/data";

const links = [
  { href: socialLinks.github, icon: Github, label: "GitHub" },
  { href: socialLinks.linkedin, icon: Linkedin, label: "LinkedIn" },
  { href: `mailto:${socialLinks.email}`, icon: Mail, label: "Email" },
  { href: socialLinks.medium, icon: BookOpen, label: "Medium" },
];

export function SocialLinks() {
  return (
    <div className="flex gap-4">
      {links.map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted transition-opacity hover:opacity-60"
          aria-label={label}
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}
