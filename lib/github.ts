import type { GitHubRepo } from "./types";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const query = `
  query {
    user(login: "camipozas") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  }
`;

export async function fetchPinnedRepos(): Promise<GitHubRepo[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return [];
  }

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const nodes = json.data?.user?.pinnedItems?.nodes ?? [];

    return nodes.map(
      (repo: {
        name: string;
        description: string | null;
        url: string;
        stargazerCount: number;
        forkCount: number;
        primaryLanguage: { name: string } | null;
      }): GitHubRepo => ({
        name: repo.name,
        description: repo.description,
        url: repo.url,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        language: repo.primaryLanguage?.name ?? null,
      })
    );
  } catch {
    return [];
  }
}
