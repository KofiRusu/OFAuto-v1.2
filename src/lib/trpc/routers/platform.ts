import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../server";
import { encrypt, decrypt } from "@/lib/security";
import { Prisma } from "@prisma/client";

// Define supported platforms
const supportedPlatforms = z.enum(['patreon', 'kofi', 'fansly', 'onlyfans']);
type SupportedPlatform = z.infer<typeof supportedPlatforms>;

// Define credential key types for each platform
const platformCredentialKeys: Record<SupportedPlatform, z.ZodType<string>> = {
  patreon: z.enum(['accessToken', 'refreshToken', 'expiresAt']),
  kofi: z.enum(['apiKey']),
  fansly: z.enum(['email', 'password', 'sessionToken']), // Assuming session token might be stored after login
  onlyfans: z.enum(['email', 'password', 'sessionToken', 'authId', 'userAgent']), // OnlyFans often needs more info
};

// Input schema for a single credential
const CredentialInputSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

// Input schema for upserting a platform connection
const UpsertPlatformInputSchema = z.object({
  clientId: z.string().uuid(),
  platformType: supportedPlatforms,
  username: z.string().optional(), // Optional username if needed
  credentials: z.array(CredentialInputSchema).min(1), // Ensure at least one credential
});

// Input schema for getting status or deleting
const PlatformActionInputSchema = z.object({
  clientId: z.string().uuid(),
  platformType: supportedPlatforms,
});

export const platformRouter = router({
  /**
   * Upsert (create or update) a platform connection for a client
   */
  upsert: protectedProcedure
    .input(UpsertPlatformInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, platformType, username, credentials } = input;

      // --- Authorization Check ---
      // Ensure user has access to the client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found.' });
      }
      if (user.role !== 'ADMIN' && client.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to modify this client\'s platforms.' });
      }

      // --- Validate Credential Keys ---
      const validKeys = platformCredentialKeys[platformType];
      if (!validKeys) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unsupported platform type: ${platformType}` });
      }
      const providedKeys = new Set(credentials.map(c => c.key));
      for (const cred of credentials) {
         // Basic validation, specific key checks might be needed
         if (!validKeys._def.values.includes(cred.key)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Invalid credential key "${cred.key}" for platform "${platformType}". Valid keys are: ${validKeys._def.values.join(', ')}`
            });
         }
      }


      // --- Database Transaction ---
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Upsert Platform entry
        const platform = await tx.platform.upsert({
          where: { clientId_platformType: { clientId, platformType } },
          update: {
            username: username || undefined, // Update username if provided
            userId: user.id, // Ensure user association is up-to-date
            isActive: true, // Assume active on upsert
          },
          create: {
            clientId,
            platformType,
            username: username || '', // Username might be required or have default
            userId: user.id,
            isActive: true,
          },
        });

        // 2. Encrypt and Upsert Credentials
        for (const cred of credentials) {
          const { iv, encryptedData, authTag } = encrypt(cred.value);
          await tx.platformCredential.upsert({
            where: { platformId_key: { platformId: platform.id, key: cred.key } },
            update: {
              value: encryptedData,
              iv,
              authTag,
            },
            create: {
              platformId: platform.id,
              key: cred.key,
              value: encryptedData,
              iv,
              authTag,
            },
          });
        }

        // Optional: Clean up old credentials not in the current input?
        // Consider if credentials not provided in the update should be removed.
        // Example: await tx.platformCredential.deleteMany({
        //   where: { platformId: platform.id, key: { notIn: Array.from(providedKeys) } },
        // });


        return { success: true, platformId: platform.id };
      });
    }),

  /**
   * Get connection status for a specific platform
   */
  getStatus: protectedProcedure
    .input(PlatformActionInputSchema)
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, platformType } = input;

      // --- Authorization Check ---
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found.' });
      }
      if (user.role !== 'ADMIN' && client.userId !== userId) {
         // Allow users to see status for their own client
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission.' });
      }

      // Find the platform connection
      const platform = await ctx.prisma.platform.findUnique({
        where: { clientId_platformType: { clientId, platformType } },
        select: {
          id: true,
          isActive: true,
          updatedAt: true,
          username: true, // Include username if useful for display
          // Select specific credentials if needed for status check, but DO NOT return values
          // credentials: { select: { key: true } }
        },
      });

      if (!platform) {
        return { status: 'not_connected' as const };
      }

      // Basic status based on existence and isActive flag
      // More complex checks (e.g., testing credentials) could be added later
      return {
        status: platform.isActive ? 'connected' : 'inactive' as const,
        platformId: platform.id,
        username: platform.username,
        lastUpdated: platform.updatedAt,
      };
    }),

  /**
   * Delete (disconnect) a platform connection and its credentials
   */
  delete: protectedProcedure
    .input(PlatformActionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, platformType } = input;

      // --- Authorization Check ---
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found.' });
      }
      if (user.role !== 'ADMIN' && client.userId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission.' });
      }

      // --- Database Deletion (within a transaction) ---
      // Find the platform first to ensure it exists and get its ID
      const platform = await ctx.prisma.platform.findUnique({
        where: { clientId_platformType: { clientId, platformType } },
        select: { id: true },
      });

      if (!platform) {
        // Already disconnected or never existed
        return { success: true, message: 'Platform not found or already disconnected.' };
      }

      // Prisma automatically handles cascading deletes if configured, but explicit is safer
      // Since PlatformCredential does NOT have onDelete: Cascade, we delete manually
      return ctx.prisma.$transaction(async (tx) => {
         // 1. Delete related credentials
         await tx.platformCredential.deleteMany({
            where: { platformId: platform.id },
         });

         // 2. Delete the platform itself
         await tx.platform.delete({
            where: { id: platform.id },
         });

         return { success: true };
      });
    }),
});

// Optional: Define a type helper for the router's input/output
export type PlatformRouter = typeof platformRouter; 