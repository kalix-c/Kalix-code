import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const modelProviders = mysqlTable("model_providers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  baseUrl: varchar("baseUrl", { length: 1024 }).notNull(),
  protocol: mysqlEnum("protocol", ["openai"]).notNull().default("openai"),
  apiKeyCiphertext: text("apiKeyCiphertext").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("model_providers_user_display_name_unique").on(table.userId, table.displayName),
  index("model_providers_user_id_idx").on(table.userId),
]);

export const githubConnections = mysqlTable("github_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenCiphertext: text("tokenCiphertext").notNull(),
  githubLogin: varchar("githubLogin", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("github_connections_user_id_unique").on(table.userId),
]);

export const providerModels = mysqlTable("provider_models", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull().references(() => modelProviders.id, { onDelete: "cascade" }),
  modelId: varchar("modelId", { length: 255 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  source: mysqlEnum("source", ["discovered", "manual"]).notNull().default("discovered"),
  pricingTier: mysqlEnum("pricingTier", ["unknown", "free", "paid"]).notNull().default("unknown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("provider_models_provider_model_id_unique").on(table.providerId, table.modelId),
  index("provider_models_provider_id_idx").on(table.providerId),
]);

export type ModelProvider = typeof modelProviders.$inferSelect;
export type ProviderModel = typeof providerModels.$inferSelect;
export type GithubConnection = typeof githubConnections.$inferSelect;
