import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPinnedRepos } from "@/lib/github";

describe("fetchPinnedRepos", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns empty array when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    const repos = await fetchPinnedRepos();
    expect(repos).toEqual([]);
  });

  it("returns repos when API responds successfully", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    const mockResponse = {
      data: {
        user: {
          pinnedItems: {
            nodes: [
              {
                name: "test-repo",
                description: "A test repo",
                url: "https://github.com/camipozas/test-repo",
                stargazerCount: 5,
                forkCount: 2,
                primaryLanguage: { name: "TypeScript" },
              },
            ],
          },
        },
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const repos = await fetchPinnedRepos();
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual({
      name: "test-repo",
      description: "A test repo",
      url: "https://github.com/camipozas/test-repo",
      stars: 5,
      forks: 2,
      language: "TypeScript",
    });
  });

  it("returns empty array when API returns non-ok response", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const repos = await fetchPinnedRepos();
    expect(repos).toEqual([]);
  });

  it("returns empty array when fetch throws", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    const repos = await fetchPinnedRepos();
    expect(repos).toEqual([]);
  });

  it("handles null primaryLanguage", async () => {
    process.env.GITHUB_TOKEN = "test-token";

    const mockResponse = {
      data: {
        user: {
          pinnedItems: {
            nodes: [
              {
                name: "no-lang",
                description: null,
                url: "https://github.com/camipozas/no-lang",
                stargazerCount: 0,
                forkCount: 0,
                primaryLanguage: null,
              },
            ],
          },
        },
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const repos = await fetchPinnedRepos();
    expect(repos[0].language).toBeNull();
    expect(repos[0].description).toBeNull();
  });
});
