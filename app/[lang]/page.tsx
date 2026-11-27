import { notFound } from "next/navigation";
import { About } from "@/components/about";
import { Certifications } from "@/components/certifications";
import { EducationSection } from "@/components/education";
import { Experience } from "@/components/experience";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Projects } from "@/components/projects";
import { Writing } from "@/components/writing";
import { getContent } from "@/lib/content";
import { isLocale } from "@/lib/locale";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    notFound();
  }
  const content = getContent(lang);

  return (
    <>
      <Nav
        lang={lang}
        navLinks={content.navLinks}
        toggleThemeLabel={content.ui.toggleTheme}
      />
      <Hero content={content} />
      <About content={content} />
      <Experience content={content} />
      <EducationSection content={content} />
      <Certifications content={content} />
      <Projects content={content} />
      <Writing content={content} />
      <Footer content={content} />
    </>
  );
}
