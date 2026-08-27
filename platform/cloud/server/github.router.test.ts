import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  deleteGithubConnectionForUser: vi.fn(),
  getGithubConnectionForUser: vi.fn(),
  getGithubConnectionSummary: vi.fn(),
  upsertGithubConnection: vi.fn(),
}));
const crypto = vi.hoisted(() => ({ decryptProviderKey: vi.fn(), encryptProviderKey: vi.fn() }));
const github = vi.hoisted(() => ({ getGithubContent: vi.fn(), getGithubIdentity: vi.fn(), listGithubBranches: vi.fn(), listGithubRepositories: vi.fn(), updateGithubFile: vi.fn() }));

vi.mock("./db", () => db);
vi.mock("./providerService", () => crypto);
vi.mock("./githubService", () => github);

import { githubRouter } from "./routers/github";

const ctx = { user: { id: 71 } } as never;
const token = "github_pat_very_long_server_only_token";

describe("github router security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crypto.encryptProviderKey.mockReturnValue("v1.github-ciphertext");
    crypto.decryptProviderKey.mockReturnValue("server-only-token");
  });

  it("stores a validated token only as ciphertext and never returns it", async () => {
    github.getGithubIdentity.mockResolvedValue("kalix-c");
    db.upsertGithubConnection.mockResolvedValue(undefined);

    const result = await githubRouter.createCaller(ctx).connect({ token });

    expect(github.getGithubIdentity).toHaveBeenCalledWith(token);
    expect(db.upsertGithubConnection).toHaveBeenCalledWith({ userId: 71, tokenCiphertext: "v1.github-ciphertext", githubLogin: "kalix-c" });
    expect(JSON.stringify(result)).not.toContain(token);
    expect(result).toEqual({ connected: true, githubLogin: "kalix-c" });
  });

  it("returns a redacted connection summary scoped to the signed-in user", async () => {
    db.getGithubConnectionSummary.mockResolvedValue({ configured: true, githubLogin: "kalix-c", updatedAt: new Date("2026-08-27") });

    const result = await githubRouter.createCaller(ctx).connection();

    expect(db.getGithubConnectionSummary).toHaveBeenCalledWith(71);
    expect(result).not.toHaveProperty("tokenCiphertext");
    expect(result).not.toHaveProperty("token");
  });

  it("uses the current user connection for repository queries and file updates", async () => {
    db.getGithubConnectionForUser.mockResolvedValue({ userId: 71, tokenCiphertext: "v1.stored" });
    github.listGithubRepositories.mockResolvedValue([{ fullName: "kalix-c/Kalix-code" }]);
    github.updateGithubFile.mockResolvedValue({ commitSha: "def456", commitUrl: null });
    const caller = githubRouter.createCaller(ctx);

    const repositories = await caller.repositories({ query: "Kalix" });
    const update = await caller.updateFile({ owner: "kalix-c", repository: "Kalix-code", path: "README.md", branch: "main", sha: "a".repeat(40), content: "update", commitMessage: "docs: update", confirmed: true });

    expect(db.getGithubConnectionForUser).toHaveBeenCalledWith(71);
    expect(github.listGithubRepositories).toHaveBeenCalledWith("server-only-token", "Kalix");
    expect(github.updateGithubFile).toHaveBeenCalledWith("server-only-token", expect.objectContaining({ path: "README.md", confirmed: true }));
    expect(JSON.stringify({ repositories, update })).not.toContain("server-only-token");
  });

  it("rejects repository access before invoking GitHub when the user has no connection", async () => {
    db.getGithubConnectionForUser.mockResolvedValue(undefined);

    await expect(githubRouter.createCaller(ctx).repositories()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(github.listGithubRepositories).not.toHaveBeenCalled();
  });
});
