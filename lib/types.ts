export interface Experience {
  role: string;
  company: string;
  date: string;
  description: string;
  bullets: string[];
  logo?: string;
}

export interface Education {
  school: string;
  degree: string;
  duration: string;
  description: string;
  bullets: string[];
  logo?: string;
}

export interface Certification {
  title: string;
  subtitle: string;
  credlyUrl: string;
  emoji?: string;
}

export interface Skill {
  name: string;
}

export interface SkillCategory {
  label: string;
  emoji: string;
  skills: string[];
  size: "large" | "small";
}

export interface BlogPost {
  url: string;
  title: string;
  description: string;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  language: string | null;
}

export interface SocialLinks {
  github: string;
  linkedin: string;
  email: string;
  medium: string;
}

export interface NavLink {
  label: string;
  href: string;
}
