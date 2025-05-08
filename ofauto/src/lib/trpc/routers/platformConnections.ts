'use server';

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../server";
import { prisma } from "@/lib/prisma";
import { encryptCredential, decryptCredential } from "@/lib/security";
import { logger } from "@/lib/logger"; // Assuming Pino logger is setup
import { verifyClientOwnership } from '@/lib/auth/verifyClientOwnership';

// Expanded platform type schema with new integrations
const platformTypeSchema = z.enum([
  'patreon', 
  'kofi', 
  'fansly', 
  'onlyfans', 
  'gumroad', 
  'twitter', 
  'instagram'
]);
type PlatformType = z.infer<typeof platformTypeSchema>;

// Base schema for all connect procedures
const baseConnectSchema = z.object({
  clientId: z.string(),
  platformType: platformTypeSchema,
});

// Specific schemas based on connection type
const connectApiKeySchema = baseConnectSchema.extend({
  apiKey: z.string().min(1, "API key cannot be empty"),
});

const connectOAuthSchema = baseConnectSchema.extend({
  accessToken: z.string().min(1, "Access token cannot be empty"),
  refreshToken: z.string().optional(),
  tokenExpiry: z.number().optional(),
});

const connectUserPassSchema = baseConnectSchema.extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Connection type for Gumroad (API key)
const connectGumroadSchema = baseConnectSchema.extend({
  platformType: z.literal('gumroad'),
  apiKey: z.string().min(1, "API key cannot be empty"),
});

// Connection type for Twitter (OAuth)
const connectTwitterSchema = baseConnectSchema.extend({
  platformType: z.literal('twitter'),
  accessToken: z.string().min(1, "Access token cannot be empty"),
  refreshToken: z.string().optional(),
  tokenExpiry: z.number().optional(),
  apiKey: z.string().min(1, "API key cannot be empty"),
  apiSecret: z.string().min(1, "API secret cannot be empty"),
});

// Connection type for Instagram (OAuth)
const connectInstagramSchema = baseConnectSchema.extend({
  platformType: z.literal('instagram'),
  accessToken: z.string().min(1, "Access token cannot be empty"),
  userId: z.string().min(1, "User ID cannot be empty"),
});

// Add wrapper function to handle different connection types
const connectPlatform = async ({
  clientId,
  platformType,
  credential,
  userId,
}: {
  clientId: string;
  platformType: PlatformType;
  credential: object;
  userId: string;
}) => {
  // Verify client ownership
  await verifyClientOwnership(userId, clientId);

  // Convert credential to string for storage
  const credentialToEncrypt = JSON.stringify(credential);

  // Encrypt credential
  const encryptedData = encryptCredential(credentialToEncrypt);
  if (!encryptedData) {
    logger.error({ platformType, clientId }, 'Failed to encrypt credential');
    throw new TRPCError({ 
      code: 'INTERNAL_SERVER_ERROR', 
      message: 'Failed to encrypt credential' 
    });
  }

  // Store in database using upsert to handle both create and update
  await prisma.clientCredential.upsert({
    where: { clientId_platformType: { clientId, platformType } },
    update: {
      credential: encryptedData.encrypted,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
    },
    create: {
      clientId,
      platformType,
      credential: encryptedData.encrypted,
      iv: encryptedData.iv,
      authTag: encryptedData.authTag,
    },
  });

  logger.info({ platformType, clientId }, 'Platform connected successfully');
  
  return { success: true, platform: platformType };
};

// Platform connection router with procedures for each platform type
export const platformConnectionsRouter = router({
  /**
   * Get connection status for all platforms for the current user's client
   * or a specific client if user is admin.
   */
  getStatus: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      // Get all credentials for this client
      const credentials = await prisma.clientCredential.findMany({
        where: { clientId },
      });
      
      // Map to status object
      const statuses: Record<string, { connected: boolean; lastUpdated?: Date }> = {};
      
      // Initialize all platform types with not connected status
      (platformTypeSchema.options as readonly string[]).forEach(platform => {
        statuses[platform] = { connected: false };
      });
      
      // Update connected platforms
      credentials.forEach(cred => {
        statuses[cred.platformType] = { 
          connected: true, 
          lastUpdated: cred.updatedAt 
        };
      });
      
      return statuses;
    }),

  /**
   * Connect Ko-fi using API Key
   */
  connectKofi: protectedProcedure
    .input(connectApiKeySchema.extend({ 
      platformType: z.literal('kofi') 
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, apiKey } = input;
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { apiKey },
        userId,
      });
    }),

  /**
   * Connect Fansly/OnlyFans using Email/Password
   * WARNING: Storing user passwords is risky. Ensure robust encryption and inform users.
   */
  connectUserPass: protectedProcedure
    .input(connectUserPassSchema.extend({ 
      platformType: z.enum(['fansly', 'onlyfans']) 
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, email, password } = input;
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { email, password },
        userId,
      });
    }),
    
  /**
   * Connect Patreon using OAuth
   */
  connectPatreon: protectedProcedure
    .input(connectOAuthSchema.extend({ 
      platformType: z.literal('patreon') 
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, accessToken, refreshToken, tokenExpiry } = input;
      
      logger.info("Patreon OAuth flow placeholder - not fully implemented", { 
        platformId: clientId, 
        userId 
      });
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { accessToken, refreshToken, tokenExpiry },
        userId,
      });
    }),

  /**
   * Gumroad Connection (API Key)
   */
  connectGumroad: protectedProcedure
    .input(connectGumroadSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, apiKey } = input;
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { apiKey },
        userId,
      });
    }),
    
  /**
   * Twitter Connection (OAuth + API Key/Secret)
   */
  connectTwitter: protectedProcedure
    .input(connectTwitterSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, accessToken, refreshToken, tokenExpiry, apiKey, apiSecret } = input;
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { accessToken, refreshToken, tokenExpiry, apiKey, apiSecret },
        userId,
      });
    }),
    
  /**
   * Instagram Connection (OAuth)
   */
  connectInstagram: protectedProcedure
    .input(connectInstagramSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, accessToken, userId: instagramUserId } = input;
      
      return connectPlatform({
        clientId,
        platformType,
        credential: { accessToken, userId: instagramUserId },
        userId,
      });
    }),
    
  /**
   * Disconnect a platform by deleting its credentials
   */
  disconnectPlatform: protectedProcedure
    .input(z.object({ 
      clientId: z.string(),
      platformType: platformTypeSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      // Delete the credential
      await prisma.clientCredential.delete({
        where: { clientId_platformType: { clientId, platformType } },
      });
      
      logger.info({ platformType, clientId }, 'Platform disconnected successfully');
      
      return { success: true, platform: platformType };
    }),
});

export type PlatformConnectionsRouter = typeof platformConnectionsRouter; 