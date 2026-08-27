import { describe, expect, it, vi } from "vitest";
import { decryptProviderKey, encryptProviderKey, normalizeSafeProviderUrl, parseDiscoveredModels } from "./providerService";

describe("provider secret service", () => {
  it("round-trips provider keys without retaining plain text in storage", () => {
    vi.stubEnv("JWT_SECRET", "test-signing-secret");
    const encrypted = encryptProviderKey("kalix-test-key");
    expect(encrypted).not.toContain("kalix-test-key");
    expect(decryptProviderKey(encrypted)).toBe("kalix-test-key");
  });

  it("parses, deduplicates, and labels OpenAI-compatible model lists", () => {
    expect(parseDiscoveredModels({
      data: [{ id: "gpt-5" }, { id: "gpt-5" }, { id: "fast", label: "Fast model" }, { id: "" }],
    })).toEqual([
      { modelId: "fast", label: "Fast model" },
      { modelId: "gpt-5", label: "gpt-5" },
    ]);
  });

  it("rejects non-HTTPS and local provider addresses before discovery", async () => {
    await expect(normalizeSafeProviderUrl("http://api.example.com/v1")).rejects.toThrow("Only HTTPS");
    await expect(normalizeSafeProviderUrl("https://localhost/v1")).rejects.toThrow("not allowed");
    await expect(normalizeSafeProviderUrl("https://192.0.2.1/v1")).rejects.toThrow("private network");
    await expect(normalizeSafeProviderUrl("https://198.51.100.1/v1")).rejects.toThrow("private network");
    await expect(normalizeSafeProviderUrl("https://[::1]/v1")).rejects.toThrow("private network");
  });
});
