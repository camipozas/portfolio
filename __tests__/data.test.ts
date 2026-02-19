import { describe, expect, it } from "vitest";
import {
  bio,
  blogPosts,
  CLOUDFRONT_BASE,
  certifications,
  education,
  experiences,
  heroEmoji,
  heroIllustration,
  name,
  navLinks,
  resumeUrl,
  sectionEmojis,
  skillCategories,
  skills,
  socialLinks,
  subtitle,
  title,
} from "@/lib/data";

describe("data exports", () => {
  it("exports personal info", () => {
    expect(name).toBe("Camila Pozas");
    expect(title).toContain("Camila");
    expect(subtitle).toBeTruthy();
    expect(bio).toBeTruthy();
  });

  it("exports CloudFront base URL", () => {
    expect(CLOUDFRONT_BASE).toMatch(/^https:\/\//);
    expect(CLOUDFRONT_BASE).toContain("cloudfront.net");
  });

  it("exports hero data", () => {
    expect(heroEmoji).toBeTruthy();
    expect(heroIllustration).toMatch(/\.svg$/);
    expect(heroIllustration).toContain(CLOUDFRONT_BASE);
  });

  it("exports resume URL", () => {
    expect(resumeUrl).toMatch(/^https:\/\//);
    expect(resumeUrl).toContain(".pdf");
  });

  it("exports social links with valid URLs", () => {
    expect(socialLinks.github).toMatch(/^https:\/\/github\.com\//);
    expect(socialLinks.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(socialLinks.email).toContain("@");
    expect(socialLinks.medium).toMatch(/^https:\/\/medium\.com\//);
  });

  it("exports nav links matching section IDs", () => {
    expect(navLinks.length).toBeGreaterThanOrEqual(4);
    for (const link of navLinks) {
      expect(link.label).toBeTruthy();
      expect(link.href).toMatch(/^#/);
    }
  });

  it("exports section emojis for all nav sections", () => {
    for (const link of navLinks) {
      const id = link.href.replace("#", "");
      expect(sectionEmojis[id]).toBeTruthy();
    }
  });
});

describe("skills", () => {
  it("exports skills array with entries", () => {
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(skill.name).toBeTruthy();
    }
  });

  it("exports skill categories with valid structure", () => {
    expect(skillCategories.length).toBeGreaterThan(0);
    for (const cat of skillCategories) {
      expect(cat.label).toBeTruthy();
      expect(cat.emoji).toBeTruthy();
      expect(cat.skills.length).toBeGreaterThan(0);
      expect(["large", "small"]).toContain(cat.size);
    }
  });
});

describe("experiences", () => {
  it("has at least one entry", () => {
    expect(experiences.length).toBeGreaterThan(0);
  });

  it("each entry has required fields", () => {
    for (const exp of experiences) {
      expect(exp.role).toBeTruthy();
      expect(exp.company).toBeTruthy();
      expect(exp.date).toBeTruthy();
      expect(exp.description).toBeTruthy();
      expect(Array.isArray(exp.bullets)).toBe(true);
    }
  });

  it("each entry has a logo URL pointing to CloudFront", () => {
    for (const exp of experiences) {
      expect(exp.logo).toBeTruthy();
      expect(exp.logo).toContain(CLOUDFRONT_BASE);
    }
  });
});

describe("education", () => {
  it("has at least one entry", () => {
    expect(education.length).toBeGreaterThan(0);
  });

  it("each entry has required fields and logo", () => {
    for (const edu of education) {
      expect(edu.school).toBeTruthy();
      expect(edu.degree).toBeTruthy();
      expect(edu.duration).toBeTruthy();
      expect(edu.logo).toBeTruthy();
      expect(edu.logo).toContain(CLOUDFRONT_BASE);
    }
  });
});

describe("certifications", () => {
  it("has at least one entry", () => {
    expect(certifications.length).toBeGreaterThan(0);
  });

  it("each entry has title, subtitle, credlyUrl, and emoji", () => {
    for (const cert of certifications) {
      expect(cert.title).toBeTruthy();
      expect(cert.subtitle).toBeTruthy();
      expect(cert.credlyUrl).toMatch(/^https:\/\/www\.credly\.com\//);
      expect(cert.emoji).toBeTruthy();
    }
  });
});

describe("blog posts", () => {
  it("has at least one entry", () => {
    expect(blogPosts.length).toBeGreaterThan(0);
  });

  it("each entry has url, title, and description", () => {
    for (const post of blogPosts) {
      expect(post.url).toMatch(/^https:\/\//);
      expect(post.title).toBeTruthy();
      expect(post.description).toBeTruthy();
    }
  });
});
