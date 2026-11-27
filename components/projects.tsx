import { ExternalLink, GitFork, Star } from 'lucide-react';
import type { Content } from '@/lib/content';
import { headingFor } from '@/lib/content';
import { fetchPinnedRepos } from '@/lib/github';
import { AnimateOnScroll } from './animate-on-scroll';
import { Section } from './section';

export async function Projects({ content }: { content: Content }) {
  const { featuredProjects, ui } = content;
  const heading = headingFor(content, 'projects');

  const repos = await fetchPinnedRepos();

  if (repos.length === 0 && featuredProjects.length === 0) {
    return (
      <Section heading={heading} id="projects">
        <p className="text-muted text-sm">
          {ui.projectsFallback}{' '}
          <a
            className="accent-link"
            href="https://github.com/camipozas"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p>
      </Section>
    );
  }

  return (
    <Section heading={heading} id="projects">
      <div className="grid gap-4 sm:grid-cols-2">
        {featuredProjects.map((project, i) => (
          <AnimateOnScroll delay={i * 100} key={project.name}>
            <a
              className="gradient-border-hover block p-4"
              href={project.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <p className="text-sm font-medium">{project.name}</p>
              <p className="text-muted mt-1 line-clamp-2 text-sm">
                {project.description}
              </p>
              <div className="text-muted mt-3 flex items-center gap-3 text-xs">
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
            delay={(featuredProjects.length + i) * 100}
            key={repo.name}
          >
            <a
              className="gradient-border-hover block p-4"
              href={repo.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <p className="text-sm font-medium">{repo.name}</p>
              {repo.description && (
                <p className="text-muted mt-1 line-clamp-2 text-sm">
                  {repo.description}
                </p>
              )}
              <div className="text-muted mt-3 flex items-center gap-3 text-xs">
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
