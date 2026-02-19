import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Experience } from "@/components/experience";
import { EducationSection } from "@/components/education";
import { Certifications } from "@/components/certifications";
import { Projects } from "@/components/projects";
import { Writing } from "@/components/writing";
import { Footer } from "@/components/footer";

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
