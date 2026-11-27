import { BookOpen, Github, Linkedin, Mail } from 'lucide-react';
import { socialLinks } from '@/lib/data';

const links = [
  { href: socialLinks.github, icon: Github, label: 'GitHub' },
  { href: socialLinks.linkedin, icon: Linkedin, label: 'LinkedIn' },
  { href: `mailto:${socialLinks.email}`, icon: Mail, label: 'Email' },
  { href: socialLinks.medium, icon: BookOpen, label: 'Medium' },
];

export function SocialLinks() {
  return (
    <div className="flex gap-4">
      {links.map(({ href, icon: Icon, label }) => (
        <a
          aria-label={label}
          className="text-muted transition-opacity hover:opacity-60"
          href={href}
          key={label}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
}
