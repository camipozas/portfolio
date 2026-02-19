import { About } from "@/components/about";
import { Certifications } from "@/components/certifications";
import { EducationSection } from "@/components/education";
import { Experience } from "@/components/experience";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Projects } from "@/components/projects";
import { Writing } from "@/components/writing";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <About />
      <Experience />
      <EducationSection />
      <Certifications />
      <Projects />
      <Writing />
      <Footer />
    </>
  );
}
