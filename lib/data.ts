import type {
  BlogPost,
  Certification,
  Education,
  Experience,
  NavLink,
  Skill,
  SkillCategory,
  SocialLinks,
} from "./types";

export const CLOUDFRONT_BASE = "https://d3j0xmrk71qrvn.cloudfront.net";

export const name = "Camila Pozas";

export const title = "Hi, I'm Camila";

export const subtitle =
  "Software Engineer with experience in backend development and continuous improvement — TypeScript, Docker, and Cloud.";

export const heroEmoji = "👋";

export const heroIllustration = `${CLOUDFRONT_BASE}/images/developerActivity.svg`;

export const sectionEmojis: Record<string, string> = {
  about: "🧑‍💻",
  experience: "💼",
  education: "🎓",
  certifications: "🏆",
  projects: "🚀",
  writing: "✍️",
};

export const resumeUrl =
  "https://d3j0xmrk71qrvn.cloudfront.net/public/CV%20Camila%20Pozas%20Garcia.pdf";

export const socialLinks: SocialLinks = {
  github: "https://github.com/camipozas",
  linkedin: "https://www.linkedin.com/in/camila-pozas-garcia/",
  email: "cpozasg1103@gmail.com",
  medium: "https://medium.com/@camipg",
};

export const navLinks: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Certifications", href: "#certifications" },
  { label: "Projects", href: "#projects" },
  { label: "Writing", href: "#writing" },
];

export const bio =
  "I build tools that reduce manual processes and automate workflows. Focused on robust, scalable backend applications using Node.js and TypeScript, with cloud infrastructure on AWS.";

export const skills: Skill[] = [
  { name: "TypeScript" },
  { name: "JavaScript" },
  { name: "React" },
  { name: "Node.js" },
  { name: "Python" },
  { name: "MongoDB" },
  { name: "MySQL" },
  { name: "AWS" },
  { name: "Docker" },
  { name: "Terraform" },
];

export const skillCategories: SkillCategory[] = [
  {
    label: "Backend",
    emoji: "⚙️",
    skills: ["Node.js", "TypeScript", "Python"],
    size: "large",
  },
  {
    label: "Frontend",
    emoji: "🎨",
    skills: ["React", "JavaScript", "Next.js"],
    size: "large",
  },
  {
    label: "Cloud & DevOps",
    emoji: "☁️",
    skills: ["AWS", "Docker", "Terraform"],
    size: "small",
  },
  {
    label: "Databases",
    emoji: "🗄️",
    skills: ["MongoDB", "MySQL", "DynamoDB"],
    size: "small",
  },
];

export const experiences: Experience[] = [
  {
    role: "Product Engineer",
    company: "Ria Money Transfer",
    date: "November 2025 — Present",
    description:
      "Building digital products for international money transfer services, collaborating with cross-functional teams on architecture and technical strategy.",
    bullets: [
      "Using TypeScript, React, Next.js, AWS, and cloud-native applications.",
    ],
    logo: `${CLOUDFRONT_BASE}/images/ria-logo.svg`,
  },
  {
    role: "Software Engineer",
    company: "MACH",
    date: "November 2022 — April 2025",
    description:
      "Registration and activation of accounts for more than 4MM users.",
    bullets: ["Backend development using Node.js and TypeScript."],
    logo: `${CLOUDFRONT_BASE}/images/logo-mach.png`,
  },
  {
    role: "Technology Operations Analyst",
    company: "Buk SpA",
    date: "December 2021 — November 2022",
    description:
      "Responsible for supporting the evaluation and implementation of technological initiatives within Buk.",
    bullets: [
      "Survey of continuous improvement and development of robots, APIs, Machine Learning projects.",
    ],
    logo: `${CLOUDFRONT_BASE}/images/bukLogo.jpeg`,
  },
  {
    role: "Process Engineer",
    company: "Empresas Dimerc SpA",
    date: "April 2021 — December 2021",
    description:
      "Review of current processes, evaluating which can be automated and streamlined.",
    bullets: ["Led intern projects on RPA, ML, and process automation."],
    logo: `${CLOUDFRONT_BASE}/images/dimerc-logo-2.jpeg`,
  },
];

export const education: Education[] = [
  {
    school: "Universidad Santiago de Chile",
    degree: "Diploma in Cloud Architecture and Security",
    duration: "September 2022 — February 2023",
    description: "Specialization in Amazon Web Services.",
    bullets: [
      "Certification: AWS Certified Cloud Practitioner.",
      "Cloud Architect role, SaaS architecture, microservices, serverless.",
    ],
    logo: `${CLOUDFRONT_BASE}/images/usach_logo.png`,
  },
  {
    school: "Universidad Adolfo Ibáñez",
    degree: "Industrial Engineering",
    duration: "March 2017 — January 2022",
    description: "Minor in IT.",
    bullets: [
      "Capstone: Reengineering of sales notes and ERP logic for Dimerc S.A.",
      "Teaching Assistant: Operations Management, Optimization, Programming, Databases.",
    ],
    logo: `${CLOUDFRONT_BASE}/images/uaiLogo.jpeg`,
  },
];

export const certifications: Certification[] = [
  {
    title: "AWS Certified Solutions Architect — Associate",
    subtitle: "Amazon Web Services",
    credlyUrl:
      "https://www.credly.com/badges/1455f7bb-892c-4929-95f2-1667ed0e79ca/public_url",
    emoji: "🏅",
  },
  {
    title: "AWS Certified Cloud Practitioner",
    subtitle: "Amazon Web Services",
    credlyUrl:
      "https://www.credly.com/badges/1cafefef-d9d7-4463-badf-6ad5e8230e77/public_url",
    emoji: "🏅",
  },
  {
    title: "AWS Academy Cloud Foundations",
    subtitle: "AWS Educate",
    credlyUrl:
      "https://www.credly.com/badges/3888ee5a-2307-488b-a6b9-81927e50d6a2/public_url",
    emoji: "🏅",
  },
];

export const blogPosts: BlogPost[] = [
  {
    url: "https://camipg.medium.com/cordyceps-automate-cloning-all-repositories-in-a-github-organization-b1961b68dd49",
    title:
      "Cordyceps: Automate cloning all repositories in a GitHub organization",
    description:
      "A tool that can clone all repositories in a GitHub organization with ease.",
  },
  {
    url: "https://camipg.medium.com/best-vs-code-extensions-for-productivity-9e02e1d39ef8",
    title: "Best VS Code Extensions for Productivity",
    description:
      "A curated list of unique extensions to boost your productivity and streamline your workflow.",
  },
  {
    url: "https://camipg.medium.com/upload-data-to-a-google-sheet-with-node-js-8afcc124a574",
    title: "Upload data to a Google Sheet with Node.js",
    description:
      "How to get data and post it in Google Sheets for stakeholders to read easily.",
  },
  {
    url: "https://camipg.medium.com/python-how-to-extract-text-from-pdf-files-easily-c9bf4dc545fa",
    title: "Python — How to extract text from PDF files easily",
    description:
      "Reading unstructured PDFs with Python using temporary folders.",
  },
];
