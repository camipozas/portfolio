import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { getContent } from "@/lib/content";
import { isLocale } from "@/lib/locale";

export default async function PicturesLayout({
  children,
  params,
}: LayoutProps<"/[lang]/pictures">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const content = getContent(lang);

  return (
    <>
      <Nav
        lang={lang}
        navLinks={content.menuLinks}
        toggleThemeLabel={content.ui.toggleTheme}
      />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-16">{children}</main>
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <Footer content={content} />
      </div>
    </>
  );
}
