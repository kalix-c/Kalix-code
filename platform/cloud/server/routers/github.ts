import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { deleteGithubConnectionForUser, getGithubConnectionForUser, getGithubConnectionSummary, upsertGithubConnection } from "../db";
import { decryptProviderKey, encryptProviderKey } from "../providerService";
import { getGithubContent, getGithubIdentity, listGithubBranches, listGithubRepositories, updateGithubFile } from "../githubService";
import { protectedProcedure, router } from "../_core/trpc";

const repositoryInput = z.object({
  owner: z.string().trim().min(1).max(100),
  repository: z.string().trim().min(1).max(100),
});

function toTrpcError(error: unknown) {
  if (error instanceof TRPCError) return error;
  return new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "تعذر إكمال طلب GitHub." });
}

async function requireConnection(userId: number) {
  const connection = await getGithubConnectionForUser(userId);
  if (!connection) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط GitHub أولًا قبل الوصول إلى مستودعاتك." });
  return decryptProviderKey(connection.tokenCiphertext);
}

export const githubRouter = router({
  connection: protectedProcedure.query(({ ctx }) => getGithubConnectionSummary(ctx.user.id)),

  connect: protectedProcedure.input(z.object({ token: z.string().trim().min(20).max(512) })).mutation(async ({ ctx, input }) => {
    try {
      const login = await getGithubIdentity(input.token);
      await upsertGithubConnection({ userId: ctx.user.id, tokenCiphertext: encryptProviderKey(input.token), githubLogin: login });
      return { connected: true, githubLogin: login };
    } catch (error) {
      throw toTrpcError(error);
    }
  }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await deleteGithubConnectionForUser(ctx.user.id);
    return { success: true };
  }),

  repositories: protectedProcedure.input(z.object({ query: z.string().trim().max(100).optional() }).optional()).query(async ({ ctx, input }) => {
    try {
      return await listGithubRepositories(await requireConnection(ctx.user.id), input?.query);
    } catch (error) {
      throw toTrpcError(error);
    }
  }),

  branches: protectedProcedure.input(repositoryInput).query(async ({ ctx, input }) => {
    try {
      return await listGithubBranches(await requireConnection(ctx.user.id), input.owner, input.repository);
    } catch (error) {
      throw toTrpcError(error);
    }
  }),

  content: protectedProcedure.input(repositoryInput.extend({ path: z.string().trim().max(500).optional(), branch: z.string().trim().min(1).max(255) })).query(async ({ ctx, input }) => {
    try {
      return await getGithubContent(await requireConnection(ctx.user.id), input.owner, input.repository, input.path, input.branch);
    } catch (error) {
      throw toTrpcError(error);
    }
  }),

  updateFile: protectedProcedure.input(repositoryInput.extend({
    path: z.string().trim().min(1).max(500),
    branch: z.string().trim().min(1).max(255),
    sha: z.string().trim().regex(/^[a-f0-9]{40,64}$/i),
    content: z.string().max(750_000),
    commitMessage: z.string().trim().min(1).max(160),
    confirmed: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    try {
      const result = await updateGithubFile(await requireConnection(ctx.user.id), input);
      return { success: true, ...result };
    } catch (error) {
      throw toTrpcError(error);
    }
  }),
});
