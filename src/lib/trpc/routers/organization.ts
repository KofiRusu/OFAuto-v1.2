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
import { prisma } from "@/lib/db";
import { 
  updateOrganizationSettingsSchema, 
  updateReferralCodeSchema, 
  organizationSettingsSchema, 
  referralSettingsSchema
} from "@/lib/schemas/organization";

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
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input, ctx }) => {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
        select: {
          orgSettings: true,
          id: true,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      return {
        clientId: client.id,
        settings: client.orgSettings || {},
      };
    }),
  
  /**
   * Update organization settings for a client
   * Manager/Admin only
   */
  updateOrgSettings: managerProcedure
    .input(updateOrganizationSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      const updatedClient = await prisma.client.update({
        where: { id: input.clientId },
        data: {
          orgSettings: input.settings,
        },
        select: {
          id: true,
          orgSettings: true,
        },
      });

      return {
        clientId: updatedClient.id,
        settings: updatedClient.orgSettings,
      };
    }),
  
  /**
   * Generate a referral code for a client
   * Manager/Admin only
   */
  generateReferralCode: managerProcedure
    .input(z.object({ clientId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const client = await prisma.client.findUnique({
        where: { id: input.clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Generate a random code with client prefix
      const prefix = client.name.substring(0, 3).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const referralCode = `${prefix}-${randomPart}`;

      const updatedClient = await prisma.client.update({
        where: { id: input.clientId },
        data: {
          referralCode: referralCode,
        },
        select: {
          id: true,
          referralCode: true,
        },
      });

      return {
        clientId: updatedClient.id,
        referralCode: updatedClient.referralCode,
      };
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