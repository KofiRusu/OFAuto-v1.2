import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { UserRole } from '@prisma/client';
import {
  OrgSettingsSchema,
  GenerateReferralCodeSchema,
  ReferralCodeResponseSchema,
  DEFAULT_ORG_SETTINGS
} from '@/lib/schemas/organization';
import { organizationService } from '@/lib/services/organizationService';

// Create manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user is a MANAGER or ADMIN
  const userRole = ctx.auth?.userRole;
  
  if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers and administrators can access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
    },
  });
});

export const organizationRouter = createTRPCRouter({
  /**
   * Get organization settings for a client
   * Manager/Admin only
   */
  getOrgSettings: managerProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const { clientId } = input;
      
      // Check if the client exists and belongs to the user
      const client = await prisma.client.findUnique({
        where: { 
          id: clientId,
          ...(auth.userRole !== UserRole.ADMIN ? { userId: auth.userId } : {})
        },
        select: {
          id: true,
          name: true,
          orgSettings: true,
        },
      });
      
      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found or you do not have access to this client',
        });
      }
      
      // Merge with default settings to ensure all properties exist
      const settings = organizationService.mergeWithDefaultSettings(
        client.orgSettings as Record<string, any> | null
      );
      
      return {
        clientId: client.id,
        settings,
      };
    }),
  
  /**
   * Update organization settings for a client
   * Manager/Admin only
   */
  updateOrgSettings: managerProcedure
    .input(OrgSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      const { clientId, settings } = input;
      
      // Check if the client exists and belongs to the user
      const client = await prisma.client.findUnique({
        where: { 
          id: clientId,
          ...(auth.userRole !== UserRole.ADMIN ? { userId: auth.userId } : {})
        },
        select: { id: true },
      });
      
      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found or you do not have access to this client',
        });
      }
      
      logger.info('Updating organization settings', {
        clientId,
        userId: auth.userId,
      });
      
      // Update the client's organization settings
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: { orgSettings: settings },
        select: {
          id: true,
          name: true,
          orgSettings: true,
        },
      });
      
      return {
        clientId: updatedClient.id,
        settings: updatedClient.orgSettings as Record<string, any>,
      };
    }),
  
  /**
   * Generate a referral code for a client
   * Manager/Admin only
   */
  generateReferralCode: managerProcedure
    .input(GenerateReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      const { clientId } = input;
      
      // Check if the client exists and belongs to the user
      const client = await prisma.client.findUnique({
        where: { 
          id: clientId,
          ...(auth.userRole !== UserRole.ADMIN ? { userId: auth.userId } : {})
        },
        select: { id: true },
      });
      
      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found or you do not have access to this client',
        });
      }
      
      logger.info('Generating referral code', {
        clientId,
        userId: auth.userId,
      });
      
      // Generate a new referral code
      try {
        const referralCode = await organizationService.createReferralCode(clientId, prisma);
        
        return {
          clientId,
          referralCode,
        };
      } catch (error) {
        logger.error('Error generating referral code', {
          clientId,
          error,
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate referral code',
        });
      }
    }),
  
  /**
   * Get client with organization data
   * Manager/Admin only
   */
  getClientWithOrgData: managerProcedure
    .input(z.object({ clientId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const { clientId } = input;
      
      // Check if the client exists and belongs to the user
      const client = await prisma.client.findUnique({
        where: { 
          id: clientId,
          ...(auth.userRole !== UserRole.ADMIN ? { userId: auth.userId } : {})
        },
      });
      
      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found or you do not have access to this client',
        });
      }
      
      return client;
    }),
  
  /**
   * Get all clients with organization data for the current user
   * Manager/Admin only
   */
  getAllClientsWithOrgData: managerProcedure
    .query(async ({ ctx }) => {
      const { prisma, auth } = ctx;
      
      // Get all clients that belong to the user (or all for admin)
      const clients = await prisma.client.findMany({
        where: auth.userRole !== UserRole.ADMIN ? { userId: auth.userId } : undefined,
        orderBy: { name: 'asc' },
      });
      
      return clients;
    }),
}); 