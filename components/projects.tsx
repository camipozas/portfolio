import { fetchPinnedRepos } from "@/lib/github";
import { Section } from "./section";
import { Star, GitFork } from "lucide-react";
import { AnimateOnScroll } from "./animate-on-scroll";

export async function Projects() {
  const repos = await fetchPinnedRepos();

  if (repos.length === 0) {
    return (
      <Section id="projects" heading="Projects">
        <p className="text-sm text-muted">
          Check out my work on{" "}
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
    <Section id="projects" heading="Projects">
      <div className="grid gap-4 sm:grid-cols-2">
        {repos.map((repo, i) => (
          <AnimateOnScroll key={repo.name} delay={i * 100}>
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
