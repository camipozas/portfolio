import { ExternalLink, GitFork, Star } from "lucide-react";
import { type Content, headingFor } from "@/lib/content";
import { fetchPinnedRepos } from "@/lib/github";
import { AnimateOnScroll } from "./animate-on-scroll";
import { Section } from "./section";

export async function Projects({ content }: { content: Content }) {
  const { featuredProjects, ui } = content;
  const heading = headingFor(content, "projects");

  const repos = await fetchPinnedRepos();

  if (repos.length === 0 && featuredProjects.length === 0) {
    return (
      <Section id="projects" heading={heading}>
        <p className="text-sm text-muted">
          {ui.projectsFallback}{" "}
          <a
            href="https://github.com/camipozas"
            target="_blank"
            rel="noopener noreferrer"
            className="accent-link"
          >
            GitHub
          </a>
          .
        </p>
      </Section>
    );
  }

  return (
    <Section id="projects" heading={heading}>
      <div className="grid gap-4 sm:grid-cols-2">
        {featuredProjects.map((project, i) => (
          <AnimateOnScroll key={project.name} delay={i * 100}>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border-hover block p-4"
            >
              <p className="text-sm font-medium">{project.name}</p>
              <p className="mt-1 text-sm text-muted line-clamp-2">
                {project.description}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                {project.language && <span>{project.language}</span>}
                <span className="flex items-center gap-1">
                  <ExternalLink size={12} />
                  {ui.live}
                </span>
              </div>
            </a>
          </AnimateOnScroll>
        ))}
        {repos.map((repo, i) => (
          <AnimateOnScroll
            key={repo.name}
            delay={(featuredProjects.length + i) * 100}
          >
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-border-hover block p-4"
            >
              <p className="text-sm font-medium">{repo.name}</p>
              {repo.description && (
                <p className="mt-1 text-sm text-muted line-clamp-2">
                  {repo.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted">
                {repo.language && <span>{repo.language}</span>}
                {repo.stars > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={12} />
                    {repo.stars}
                  </span>
                )}
                {repo.forks > 0 && (
                  <span className="flex items-center gap-1">
                    <GitFork size={12} />
                    {repo.forks}
                  </span>
                )}
              </div>
            </a>
          </AnimateOnScroll>
        ))}
      </div>
    </Section>
  );
}
