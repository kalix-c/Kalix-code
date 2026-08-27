import { afterEach, describe, expect, it, vi } from "vitest";
import { getGithubContent, listGithubRepositories, updateGithubFile } from "./githubService";

const githubResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("GitHub service safety", () => {
  it("lists only normalized repository summaries and applies the local search filter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(githubResponse([{
      full_name: "kalix-c/Kalix-code", name: "Kalix-code", description: "AI workspace", private: false,
      html_url: "https://github.com/kalix-c/Kalix-code", default_branch: "main", updated_at: "2026-08-27T00:00:00Z",
      language: "TypeScript", permissions: { push: true }, archived: false,
    }]));
    vi.stubGlobal("fetch", fetchMock);

    const repositories = await listGithubRepositories("server-only-token", "typescript");

    expect(repositories).toEqual([expect.objectContaining({ fullName: "kalix-c/Kalix-code", canPush: true })]);
    expect(JSON.stringify(repositories)).not.toContain("server-only-token");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/user/repos"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer server-only-token" }) }));
  });

  it("rejects traversal paths before requesting GitHub", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGithubContent("token", "kalix-c", "Kalix-code", "../.env", "main")).rejects.toThrow("file path is invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("writes base64 content only with a valid file revision and a bounded commit message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(githubResponse({ commit: { sha: "abc123", html_url: "https://github.com/commit/abc123" } }));
    vi.stubGlobal("fetch", fetchMock);
    const sha = "a".repeat(40);

    const result = await updateGithubFile("server-only-token", { owner: "kalix-c", repository: "Kalix-code", path: "README.md", branch: "main", sha, content: "مرحبا Kalix", commitMessage: "docs: update README" });

    expect(result).toEqual({ commitSha: "abc123", commitUrl: "https://github.com/commit/abc123" });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(request.body as string)).toMatchObject({ sha, branch: "main", message: "docs: update README", content: Buffer.from("مرحبا Kalix", "utf8").toString("base64") });
    await expect(updateGithubFile("token", { owner: "kalix-c", repository: "Kalix-code", path: "README.md", branch: "main", sha: "wrong", content: "x", commitMessage: "x" })).rejects.toThrow("إصدار الملف غير صالح");
  });
});
