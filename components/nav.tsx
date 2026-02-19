"use client";

import { name, navLinks } from "@/lib/data";
import { ThemeToggle } from "./theme-toggle";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <a href="/" className="text-sm font-medium">
          {name}
        </a>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 sm:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
