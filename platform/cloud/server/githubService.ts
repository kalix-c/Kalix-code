const GITHUB_API_ROOT = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";
const MAX_FILE_BYTES = 750_000;

type GithubApiError = { message?: string };
type GithubRepository = {
  full_name: string;
  name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string | null;
  language: string | null;
  permissions?: { pull?: boolean; push?: boolean };
  archived?: boolean;
};

function safeRepositoryPart(value: string, field: string) {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(normalized)) {
    throw new Error(`${field} contains unsupported characters`);
  }
  return normalized;
}

function safeReference(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 255 || /[~^:?*\\[\s]|\.\./.test(normalized)) {
    throw new Error("The branch name is invalid");
  }
  return normalized;
}

function safeFilePath(value: string) {
  const normalized = value.trim().replace(/^\/+/, "");
  if (!normalized || normalized.length > 500 || normalized.split("/").some(part => !part || part === "." || part === ".." || /[\0\\]/.test(part))) {
    throw new Error("The file path is invalid");
  }
  return normalized;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "Kalix-Code",
  };
}

async function requestGithub<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GITHUB_API_ROOT}${path}`, {
    ...init,
    headers: { ...githubHeaders(token), ...init.headers },
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json().catch(() => ({})) as T & GithubApiError;
  if (response.ok) return body;
  if (response.status === 401) throw new Error("رمز GitHub غير صالح أو انتهت صلاحيته.");
  if (response.status === 403) throw new Error("لا يملك رمز GitHub الصلاحية الكافية لهذا الإجراء، أو تم تجاوز حد الطلبات.");
  if (response.status === 404) throw new Error("المستودع أو الفرع أو الملف غير متاح لهذا الاتصال.");
  if (response.status === 409) throw new Error("تعارض في الملف. حدّث المحتوى قبل إنشاء commit جديد.");
  throw new Error("تعذر إكمال طلب GitHub بأمان.");
}

export type RepositorySummary = {
  fullName: string;
  name: string;
  description: string | null;
  isPrivate: boolean;
  htmlUrl: string;
  defaultBranch: string;
  updatedAt: string | null;
  language: string | null;
  canPush: boolean;
  isArchived: boolean;
};

export async function getGithubIdentity(token: string) {
  const user = await requestGithub<{ login?: string }>(token, "/user");
  if (!user.login) throw new Error("تعذر التحقق من هوية GitHub لهذا الرمز.");
  return user.login;
}

export async function listGithubRepositories(token: string, query?: string): Promise<RepositorySummary[]> {
  const repos = await requestGithub<GithubRepository[]>(token, "/user/repos?affiliation=owner%2Ccollaborator%2Corganization_member&sort=updated&direction=desc&per_page=100");
  const filter = query?.trim().toLocaleLowerCase() ?? "";
  return repos.map(repo => ({
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description,
    isPrivate: repo.private,
    htmlUrl: repo.html_url,
    defaultBranch: repo.default_branch,
    updatedAt: repo.updated_at,
    language: repo.language,
    canPush: Boolean(repo.permissions?.push),
    isArchived: Boolean(repo.archived),
  })).filter(repo => !filter || `${repo.fullName} ${repo.description ?? ""} ${repo.language ?? ""}`.toLocaleLowerCase().includes(filter));
}

export async function listGithubBranches(token: string, owner: string, repository: string) {
  const safeOwner = safeRepositoryPart(owner, "The owner");
  const safeRepository = safeRepositoryPart(repository, "The repository");
  const branches = await requestGithub<Array<{ name?: string; protected?: boolean }>>(token, `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/branches?per_page=100`);
  return branches.filter(branch => typeof branch.name === "string").map(branch => ({ name: branch.name as string, protected: Boolean(branch.protected) }));
}

type GithubDirectoryEntry = { type?: string; name?: string; path?: string; sha?: string; size?: number };
type GithubFile = GithubDirectoryEntry & { content?: string; encoding?: string };

export type RepositoryContent =
  | { kind: "directory"; path: string; entries: Array<{ type: "file" | "dir"; name: string; path: string; sha: string; size: number }> }
  | { kind: "file"; path: string; sha: string; size: number; content: string };

export async function getGithubContent(token: string, owner: string, repository: string, path: string | undefined, branch: string): Promise<RepositoryContent> {
  const safeOwner = safeRepositoryPart(owner, "The owner");
  const safeRepository = safeRepositoryPart(repository, "The repository");
  const safeBranch = safeReference(branch);
  const safePath = path ? safeFilePath(path) : "";
  const endpoint = `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/contents${safePath ? `/${safePath.split("/").map(encodeURIComponent).join("/")}` : ""}?ref=${encodeURIComponent(safeBranch)}`;
  const response = await requestGithub<GithubDirectoryEntry[] | GithubFile>(token, endpoint);
  if (Array.isArray(response)) {
    return {
      kind: "directory",
      path: safePath,
      entries: response.filter(entry => (entry.type === "file" || entry.type === "dir") && entry.name && entry.path && entry.sha).map(entry => ({
        type: entry.type as "file" | "dir",
        name: entry.name as string,
        path: entry.path as string,
        sha: entry.sha as string,
        size: entry.size ?? 0,
      })),
    };
  }
  if (response.type !== "file" || !response.path || !response.sha || response.encoding !== "base64" || typeof response.content !== "string") {
    throw new Error("لا يمكن فتح هذا العنصر كمحرر نصي.");
  }
  const content = Buffer.from(response.content.replace(/\n/g, ""), "base64").toString("utf8");
  if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) throw new Error("الملف أكبر من حد التحرير الآمن في Kalix.");
  return { kind: "file", path: response.path, sha: response.sha, size: response.size ?? Buffer.byteLength(content, "utf8"), content };
}

export async function updateGithubFile(token: string, input: { owner: string; repository: string; path: string; branch: string; sha: string; content: string; commitMessage: string }) {
  const safeOwner = safeRepositoryPart(input.owner, "The owner");
  const safeRepository = safeRepositoryPart(input.repository, "The repository");
  const safePath = safeFilePath(input.path);
  const safeBranch = safeReference(input.branch);
  if (!/^[a-f0-9]{40,64}$/i.test(input.sha)) throw new Error("إصدار الملف غير صالح. حدّث الملف قبل الحفظ.");
  if (!input.commitMessage.trim() || input.commitMessage.trim().length > 160) throw new Error("اكتب رسالة commit بين 1 و160 حرفًا.");
  if (Buffer.byteLength(input.content, "utf8") > MAX_FILE_BYTES) throw new Error("المحتوى يتجاوز حد التحرير الآمن في Kalix.");
  const body = {
    message: input.commitMessage.trim(),
    content: Buffer.from(input.content, "utf8").toString("base64"),
    sha: input.sha,
    branch: safeBranch,
  };
  const response = await requestGithub<{ commit?: { sha?: string; html_url?: string } }>(token, `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/contents/${safePath.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { commitSha: response.commit?.sha ?? null, commitUrl: response.commit?.html_url ?? null };
}
