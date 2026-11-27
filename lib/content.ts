import {
  bio,
  blogPosts,
  certifications,
  education,
  experiences,
  featuredProjects,
  navLinks,
  picturesLink,
  siteDescription,
  siteTitle,
  skillCategories,
  subtitle,
  title,
  ui,
} from './data';
import type { Locale } from './locale';
import es from './translations/es.json';

export type Translate = (text: string) => string;

// Keyed by the English text, so reordering or adding entries in data.ts
// never shifts a translation onto the wrong item.
const dictionaries: Record<Locale, Record<string, string>> = { en: {}, es };

export function translator(lang: Locale): Translate {
  const dictionary = dictionaries[lang];
  return (text) => dictionary[text] ?? text;
}

// Every string passed to `t` needs an entry in translations/es.json (the i18n test checks it).
// Names, companies, schools, certification and post titles stay in English.
export function getContent(lang: Locale, t: Translate = translator(lang)) {
  return {
    lang,
    siteTitle: t(siteTitle),
    siteDescription: t(siteDescription),
    title: t(title),
    subtitle: t(subtitle),
    bio: t(bio),
    ui: Object.fromEntries(
      Object.entries(ui).map(([key, text]) => [key, t(text)])
    ) as typeof ui,
    navLinks: navLinks.map((link) => ({ ...link, label: t(link.label) })),
    picturesLabel: t(picturesLink.label),
    menuLinks: [...navLinks, picturesLink].map((link) => ({
      ...link,
      label: t(link.label),
    })),
    skillCategories: skillCategories.map((category) => ({
      ...category,
      label: t(category.label),
    })),
    experiences: experiences.map((exp) => ({
      ...exp,
      role: t(exp.role),
      date: t(exp.date),
      description: t(exp.description),
      bullets: exp.bullets.map(t),
    })),
    education: education.map((edu) => ({
      ...edu,
      degree: t(edu.degree),
      duration: t(edu.duration),
      description: t(edu.description),
      bullets: edu.bullets.map(t),
    })),
    certifications,
    featuredProjects: featuredProjects.map((project) => ({
      ...project,
      description: t(project.description),
    })),
    blogPosts: blogPosts.map((post) => ({
      ...post,
      description: t(post.description),
    })),
  };
}

export type Content = ReturnType<typeof getContent>;

export function headingFor(content: Content, id: string): string {
  return content.navLinks.find((link) => link.href === `#${id}`)?.label ?? id;
}

export function photoCount(content: Content, count: number): string {
  return `${count} ${count === 1 ? content.ui.photo : content.ui.photos}`;
}

export function albumCount(content: Content, count: number): string {
  return `${count} ${count === 1 ? content.ui.album : content.ui.albums}`;
}
