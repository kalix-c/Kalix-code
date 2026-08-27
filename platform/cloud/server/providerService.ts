import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const CIPHER_VERSION = "v1";
const DISCOVERY_TIMEOUT_MS = 10_000;
const MAX_DISCOVERED_MODELS = 100;

export type DiscoveredModel = { modelId: string; label: string };

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Provider secret storage is not configured");
  return createHash("sha256").update(`kalix-provider-key:${secret}`).digest();
}

export function encryptProviderKey(apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [CIPHER_VERSION, iv.toString("base64url"), encrypted.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptProviderKey(payload: string): string {
  const [version, ivText, encryptedText, tagText] = payload.split(".");
  if (version !== CIPHER_VERSION || !ivText || !encryptedText || !tagText) {
    throw new Error("Stored provider key has an invalid format");
  }
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || first >= 224
    || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31)
    || (first === 100 && second >= 64 && second <= 127) || (first === 192 && [0, 2, 168].includes(second))
    || (first === 198 && [18, 19, 51].includes(second)) || (first === 203 && second === 0);
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("::ffff:")
    || normalized.startsWith("100:") || normalized.startsWith("2001:db8:") || normalized.startsWith("fc")
    || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9")
    || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("ff");
}

export async function normalizeSafeProviderUrl(rawValue: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawValue.trim());
  } catch {
    throw new Error("Enter a complete HTTPS URL for the provider");
  }
  if (url.protocol !== "https:") throw new Error("Only HTTPS provider URLs are allowed");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (url.username || url.password || url.port || hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("This provider address is not allowed");
  }
  if ((isIP(hostname) === 4 && isPrivateIpv4(hostname)) || (isIP(hostname) === 6 && isPrivateIpv6(hostname))) {
    throw new Error("This provider address resolves to a private network and is not allowed");
  }
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(item => item.family === 4
    ? isPrivateIpv4(item.address)
    : isPrivateIpv6(item.address))) {
    throw new Error("This provider address resolves to a private network and is not allowed");
  }
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

export function parseDiscoveredModels(payload: unknown): DiscoveredModel[] {
  const root = payload as { data?: unknown; models?: unknown };
  const candidates = Array.isArray(root?.data) ? root.data : Array.isArray(root?.models) ? root.models : [];
  const seen = new Set<string>();
  const result: DiscoveredModel[] = [];
  for (const candidate of candidates) {
    const item = candidate as { id?: unknown; name?: unknown; label?: unknown };
    const modelId = typeof item?.id === "string" ? item.id.trim() : typeof item?.name === "string" ? item.name.trim() : "";
    if (!modelId || seen.has(modelId)) continue;
    seen.add(modelId);
    const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : modelId;
    result.push({ modelId, label });
    if (result.length === MAX_DISCOVERED_MODELS) break;
  }
  return result.sort((left, right) => left.label.localeCompare(right.label));
}

export async function discoverProviderModels(baseUrl: string, apiKey: string): Promise<DiscoveredModel[]> {
  const endpoint = new URL("models", `${baseUrl}/`);
  const signal = AbortSignal.timeout(DISCOVERY_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      redirect: "error",
      signal,
    });
  } catch {
    throw new Error("Kalix could not connect to this provider. Check the URL and API key, then try again.");
  }
  if (!response.ok) throw new Error(`The provider returned HTTP ${response.status} while loading models`);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The provider did not return a JSON model list");
  }
  const models = parseDiscoveredModels(payload);
  if (models.length === 0) throw new Error("No usable models were returned. Add a model manually instead.");
  return models;
}
