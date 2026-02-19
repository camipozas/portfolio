<div align="center">

# ✨ camipozas.dev

**Minimalist personal portfolio — monochrome, typography-driven, fast.**

[![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-0F172A?logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)](https://vercel.com/)

<br />

<img src="https://github.com/user-attachments/assets/placeholder" alt="Portfolio screenshot" width="600" />

> *Inspired by [leerob.io](https://leerob.io) and [rauno.me](https://rauno.me)*

</div>

---

## 🏗️ Stack

| Layer | Tech |
|---|---|
| ⚡ Framework | [Next.js 16](https://nextjs.org/) (App Router, RSC) |
| 🎨 Styling | [Tailwind CSS v4](https://tailwindcss.com/) + CSS custom properties |
| 🧩 Components | [shadcn/ui](https://ui.shadcn.com/) (button, card, separator, badge) |
| 🌗 Theme | [next-themes](https://github.com/pacocoursey/next-themes) (light / dark) |
| 🔤 Icons | [lucide-react](https://lucide.dev/) |
| 📦 Package Manager | [pnpm](https://pnpm.io/) |

## 🎨 Design

- **Near-monochrome palette** — black, white, one neutral gray. No accent colors.
- **Typography-driven** — clean type hierarchy, generous whitespace, narrow content column (672px).
- **No decorations** — no colored badges, no gradients, no shadows, no background patterns.
- **Dark mode** — seamless toggle, respects system preference.

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/camipozas/portfolio.git
cd portfolio

# Install
pnpm install

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔧 Environment Variables

Create a `.env.local` file in the root:

```env
GITHUB_TOKEN=ghp_your_token_here
```

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | No | GitHub PAT — used to fetch pinned repos via GraphQL |

> 💡 Without the token, the Projects section shows a fallback link to GitHub.

## 📁 Project Structure

```
portfolio/
├── 📂 app/
│   ├── layout.tsx        # Root layout (Inter font, ThemeProvider)
│   ├── page.tsx          # Home page (all sections)
│   ├── globals.css       # Tailwind + monochrome CSS vars
│   ├── robots.ts
│   └── sitemap.ts
├── 📂 components/
│   ├── 📂 ui/            # shadcn/ui primitives
│   ├── nav.tsx           # Sticky nav + theme toggle
│   ├── hero.tsx          # Name, subtitle, social links
│   ├── about.tsx         # Bio + skill badges
│   ├── experience.tsx    # Work timeline
│   ├── education.tsx     # Education timeline
│   ├── certifications.tsx # AWS certs with Credly links
│   ├── projects.tsx      # GitHub pinned repos (server component)
│   ├── writing.tsx       # Blog posts
│   └── footer.tsx        # Contact + socials
├── 📂 lib/
│   ├── types.ts          # TypeScript interfaces
│   ├── data.ts           # All portfolio content
│   └── github.ts         # GitHub GraphQL (ISR 1h)
└── package.json
```

## 📬 Contact

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/camila-pozas-garcia/)
[![Medium](https://img.shields.io/badge/Medium-000?logo=medium&logoColor=white)](https://medium.com/@camipg)
[![Email](https://img.shields.io/badge/Email-EA4335?logo=gmail&logoColor=white)](mailto:cpozasg1103@gmail.com)

---

<div align="center">

Made with 🖤 by [Camila Pozas](https://github.com/camipozas)

</div>
