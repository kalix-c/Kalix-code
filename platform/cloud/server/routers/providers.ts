import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addManualProviderModel,
  createProvider,
  deleteProviderForUser,
  deleteProviderModel,
  getProviderForUser,
  listProvidersForUser,
  replaceProviderModels,
  updateProviderModelPricing,
  updateProviderForUser,
} from "../db";
import { decryptProviderKey, discoverProviderModels, encryptProviderKey, normalizeSafeProviderUrl } from "../providerService";
import { protectedProcedure, router } from "../_core/trpc";

const providerFields = z.object({
  displayName: z.string().trim().min(2).max(120),
  baseUrl: z.string().trim().min(8).max(1024),
  protocol: z.literal("openai").default("openai"),
});

function toTrpcError(error: unknown) {
  if (error instanceof TRPCError) return error;
  return new TRPCError({
    code: "BAD_REQUEST",
    message: error instanceof Error ? error.message : "The provider request could not be completed",
  });
}

async function requireProvider(providerId: number, userId: number) {
  const provider = await getProviderForUser(providerId, userId);
  if (!provider) throw new TRPCError({ code: "NOT_FOUND", message: "Provider not found" });
  return provider;
}

export const providersRouter = router({
  list: protectedProcedure.query(({ ctx }) => listProvidersForUser(ctx.user.id)),

  create: protectedProcedure.input(providerFields.extend({ apiKey: z.string().min(1).max(2048) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const baseUrl = await normalizeSafeProviderUrl(input.baseUrl);
        const providerId = await createProvider({
          userId: ctx.user.id,
          displayName: input.displayName,
          baseUrl,
          protocol: input.protocol,
          apiKeyCiphertext: encryptProviderKey(input.apiKey),
        });
        if (!providerId) throw new Error("Kalix could not save this provider");
        try {
          const models = await discoverProviderModels(baseUrl, input.apiKey);
          await replaceProviderModels(providerId, models);
          return { providerId, discovery: { status: "success" as const, modelCount: models.length } };
        } catch (error) {
          return { providerId, discovery: { status: "failed" as const, message: error instanceof Error ? error.message : "Model discovery failed" } };
        }
      } catch (error) {
        throw toTrpcError(error);
      }
    }),

  update: protectedProcedure.input(providerFields.extend({ id: z.number().int().positive(), apiKey: z.string().min(1).max(2048).optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await requireProvider(input.id, ctx.user.id);
        const baseUrl = await normalizeSafeProviderUrl(input.baseUrl);
        await updateProviderForUser({
          id: input.id,
          userId: ctx.user.id,
          displayName: input.displayName,
          baseUrl,
          protocol: input.protocol,
          apiKeyCiphertext: input.apiKey ? encryptProviderKey(input.apiKey) : undefined,
        });
        return { success: true };
      } catch (error) {
        throw toTrpcError(error);
      }
    }),

  discover: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const provider = await requireProvider(input.id, ctx.user.id);
      const baseUrl = await normalizeSafeProviderUrl(provider.baseUrl);
      const models = await discoverProviderModels(baseUrl, decryptProviderKey(provider.apiKeyCiphertext));
      await replaceProviderModels(provider.id, models);
      return { modelCount: models.length };
    } catch (error) {
      throw toTrpcError(error);
    }
  }),

  addManualModel: protectedProcedure.input(z.object({
    providerId: z.number().int().positive(),
    modelId: z.string().trim().min(1).max(255),
    label: z.string().trim().min(1).max(255),
    pricingTier: z.enum(["unknown", "free", "paid"]).default("unknown"),
  })).mutation(async ({ ctx, input }) => {
    await requireProvider(input.providerId, ctx.user.id);
    await addManualProviderModel(input);
    return { success: true };
  }),

  setModelPricing: protectedProcedure.input(z.object({
    providerId: z.number().int().positive(),
    modelId: z.number().int().positive(),
    pricingTier: z.enum(["unknown", "free", "paid"]),
  })).mutation(async ({ ctx, input }) => {
    await requireProvider(input.providerId, ctx.user.id);
    await updateProviderModelPricing(input);
    return { success: true };
  }),

  removeModel: protectedProcedure.input(z.object({
    providerId: z.number().int().positive(),
    modelId: z.number().int().positive(),
  })).mutation(async ({ ctx, input }) => {
    await requireProvider(input.providerId, ctx.user.id);
    await deleteProviderModel(input.providerId, input.modelId);
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireProvider(input.id, ctx.user.id);
    await deleteProviderForUser(input.id, ctx.user.id);
    return { success: true };
  }),
});
