import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  addManualProviderModel: vi.fn(),
  createProvider: vi.fn(),
  deleteProviderForUser: vi.fn(),
  deleteProviderModel: vi.fn(),
  getProviderForUser: vi.fn(),
  listProvidersForUser: vi.fn(),
  replaceProviderModels: vi.fn(),
  updateProviderModelPricing: vi.fn(),
  updateProviderForUser: vi.fn(),
}));
const providerService = vi.hoisted(() => ({
  decryptProviderKey: vi.fn(),
  discoverProviderModels: vi.fn(),
  encryptProviderKey: vi.fn(),
  normalizeSafeProviderUrl: vi.fn(),
}));

vi.mock("./db", () => db);
vi.mock("./providerService", () => providerService);

import { providersRouter } from "./routers/providers";

const ctx = { user: { id: 31 } } as never;
const safeInput = { displayName: "Team inference", baseUrl: "https://api.example.com/v1", protocol: "openai" as const };

describe("providers router security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerService.normalizeSafeProviderUrl.mockResolvedValue("https://api.example.com/v1");
    providerService.encryptProviderKey.mockReturnValue("v1.encrypted-payload");
    providerService.discoverProviderModels.mockResolvedValue([{ modelId: "kalix-fast", label: "Kalix Fast" }]);
  });

  it("scopes lists and new providers to the authenticated user while redacting the supplied API key", async () => {
    db.listProvidersForUser.mockResolvedValue([]);
    db.createProvider.mockResolvedValue(8);
    db.replaceProviderModels.mockResolvedValue(undefined);
    const caller = providersRouter.createCaller(ctx);

    await caller.list();
    const result = await caller.create({ ...safeInput, apiKey: "secret-create-key" });

    expect(db.listProvidersForUser).toHaveBeenCalledWith(31);
    expect(db.createProvider).toHaveBeenCalledWith(expect.objectContaining({ userId: 31, apiKeyCiphertext: "v1.encrypted-payload" }));
    expect(JSON.stringify(result)).not.toContain("secret-create-key");
    expect(result).toEqual({ providerId: 8, discovery: { status: "success", modelCount: 1 } });
  });

  it("redacts updated keys and preserves user ownership when changing a provider", async () => {
    db.getProviderForUser.mockResolvedValue({ id: 8, userId: 31 });
    db.updateProviderForUser.mockResolvedValue(undefined);
    const result = await providersRouter.createCaller(ctx).update({ id: 8, ...safeInput, apiKey: "secret-update-key" });

    expect(db.getProviderForUser).toHaveBeenCalledWith(8, 31);
    expect(db.updateProviderForUser).toHaveBeenCalledWith(expect.objectContaining({ id: 8, userId: 31, apiKeyCiphertext: "v1.encrypted-payload" }));
    expect(JSON.stringify(result)).not.toContain("secret-update-key");
  });

  it("uses the saved key only on the server for discovery and returns a count instead", async () => {
    db.getProviderForUser.mockResolvedValue({ id: 8, userId: 31, baseUrl: "https://api.example.com/v1", apiKeyCiphertext: "v1.stored" });
    providerService.decryptProviderKey.mockReturnValue("server-only-key");
    db.replaceProviderModels.mockResolvedValue(undefined);
    const result = await providersRouter.createCaller(ctx).discover({ id: 8 });

    expect(providerService.decryptProviderKey).toHaveBeenCalledWith("v1.stored");
    expect(providerService.discoverProviderModels).toHaveBeenCalledWith("https://api.example.com/v1", "server-only-key");
    expect(JSON.stringify(result)).not.toContain("server-only-key");
    expect(result).toEqual({ modelCount: 1 });
  });

  it("refuses every provider mutation before touching data if ownership fails", async () => {
    db.getProviderForUser.mockResolvedValue(undefined);
    const caller = providersRouter.createCaller(ctx);

    await expect(caller.update({ id: 99, ...safeInput })).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });
    await expect(caller.discover({ id: 99 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });
    await expect(caller.addManualModel({ providerId: 99, modelId: "m", label: "M" })).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });
    await expect(caller.removeModel({ providerId: 99, modelId: 4 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });
    await expect(caller.remove({ id: 99 })).rejects.toMatchObject<Partial<TRPCError>>({ code: "NOT_FOUND" });

    expect(db.updateProviderForUser).not.toHaveBeenCalled();
    expect(db.replaceProviderModels).not.toHaveBeenCalled();
    expect(db.addManualProviderModel).not.toHaveBeenCalled();
    expect(db.deleteProviderModel).not.toHaveBeenCalled();
    expect(db.deleteProviderForUser).not.toHaveBeenCalled();
  });
});
