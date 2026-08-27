import { and, asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { githubConnections, InsertUser, modelProviders, providerModels, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export type ProviderSummary = {
  id: number;
  displayName: string;
  baseUrl: string;
  protocol: "openai";
  apiKeyConfigured: boolean;
  createdAt: Date;
  updatedAt: Date;
  models: Array<{
    id: number;
    modelId: string;
    label: string;
    source: "discovered" | "manual";
    pricingTier: "unknown" | "free" | "paid";
  }>;
};

export async function listProvidersForUser(userId: number): Promise<ProviderSummary[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const providers = await db.select().from(modelProviders)
    .where(eq(modelProviders.userId, userId))
    .orderBy(asc(modelProviders.displayName));

  return Promise.all(providers.map(async provider => {
    const models = await db.select({
      id: providerModels.id,
      modelId: providerModels.modelId,
      label: providerModels.label,
      source: providerModels.source,
      pricingTier: providerModels.pricingTier,
    }).from(providerModels)
      .where(eq(providerModels.providerId, provider.id))
      .orderBy(asc(providerModels.label));
    return {
      id: provider.id,
      displayName: provider.displayName,
      baseUrl: provider.baseUrl,
      protocol: provider.protocol,
      apiKeyConfigured: Boolean(provider.apiKeyCiphertext),
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      models,
    };
  }));
}

export async function getProviderForUser(providerId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.select().from(modelProviders)
    .where(and(eq(modelProviders.id, providerId), eq(modelProviders.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createProvider(input: {
  userId: number;
  displayName: string;
  baseUrl: string;
  protocol: "openai";
  apiKeyCiphertext: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(modelProviders).values(input).$returningId();
  return result[0]?.id;
}

export async function updateProviderForUser(input: {
  id: number;
  userId: number;
  displayName: string;
  baseUrl: string;
  protocol: "openai";
  apiKeyCiphertext?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const updates: Partial<typeof modelProviders.$inferInsert> = {
    displayName: input.displayName,
    baseUrl: input.baseUrl,
    protocol: input.protocol,
    updatedAt: new Date(),
  };
  if (input.apiKeyCiphertext) updates.apiKeyCiphertext = input.apiKeyCiphertext;
  await db.update(modelProviders).set(updates)
    .where(and(eq(modelProviders.id, input.id), eq(modelProviders.userId, input.userId)));
}

export async function deleteProviderForUser(providerId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(modelProviders)
    .where(and(eq(modelProviders.id, providerId), eq(modelProviders.userId, userId)));
}

export async function replaceProviderModels(providerId: number, models: Array<{ modelId: string; label: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.transaction(async tx => {
    await tx.delete(providerModels).where(eq(providerModels.providerId, providerId));
    if (models.length > 0) {
      await tx.insert(providerModels).values(models.map(model => ({
        providerId,
        modelId: model.modelId,
        label: model.label,
        source: "discovered" as const,
      })));
    }
  });
}

export async function addManualProviderModel(input: { providerId: number; modelId: string; label: string; pricingTier?: "unknown" | "free" | "paid" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const pricingTier = input.pricingTier ?? "unknown";
  await db.insert(providerModels).values({ ...input, pricingTier, source: "manual" })
    .onDuplicateKeyUpdate({ set: { label: input.label, pricingTier, source: "manual" } });
}

export async function updateProviderModelPricing(input: { providerId: number; modelId: number; pricingTier: "unknown" | "free" | "paid" }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(providerModels).set({ pricingTier: input.pricingTier })
    .where(and(eq(providerModels.providerId, input.providerId), eq(providerModels.id, input.modelId)));
}

export async function deleteProviderModel(providerId: number, modelId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(providerModels)
    .where(and(eq(providerModels.providerId, providerId), eq(providerModels.id, modelId)));
}

export type GithubConnectionSummary = { configured: boolean; githubLogin: string | null; updatedAt: Date | null };

export async function getGithubConnectionSummary(userId: number): Promise<GithubConnectionSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.select({ githubLogin: githubConnections.githubLogin, updatedAt: githubConnections.updatedAt })
    .from(githubConnections).where(eq(githubConnections.userId, userId)).limit(1);
  return result[0] ? { configured: true, githubLogin: result[0].githubLogin, updatedAt: result[0].updatedAt } : { configured: false, githubLogin: null, updatedAt: null };
}

export async function getGithubConnectionForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.select().from(githubConnections).where(eq(githubConnections.userId, userId)).limit(1);
  return result[0];
}

export async function upsertGithubConnection(input: { userId: number; tokenCiphertext: string; githubLogin: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(githubConnections).values(input).onDuplicateKeyUpdate({
    set: { tokenCiphertext: input.tokenCiphertext, githubLogin: input.githubLogin, updatedAt: new Date() },
  });
}

export async function deleteGithubConnectionForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(githubConnections).where(eq(githubConnections.userId, userId));
}
