import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, managerProcedure } from "../server";
import { 
  campaignSchema, 
  createCampaignSchema,
  updateCampaignSchema 
} from "@/lib/schemas/campaign";

export const campaignRouter = router({
  /**
   * Get all campaigns based on client and user role
   */
  getAll: protectedProcedure
    .input(
      campaignSchema.pick({ 
        clientId: true,
        status: true 
      }).partial()
    )
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, status } = input;

      // Base query with optional filters
      const where = {
        ...(clientId && { clientId }),
        ...(status && { status }),
      };
      
      // If admin, return all campaigns or filtered by clientId/status
      // If manager or user, only return their assigned campaigns
      if (user.role !== 'ADMIN') {
        // For non-admins, get their clients
        const clients = await ctx.prisma.client.findMany({
          where: { userId: userId as string },
          select: { id: true },
        });
        
        const clientIds = clients.map(client => client.id);
        
        if (clientId && !clientIds.includes(clientId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this client',
          });
        }
        
        // Add client filter for non-admins
        where.clientId = clientId || { in: clientIds };
      }

      return await ctx.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          platforms: {
            select: { id: true, name: true, type: true }
          }
        }
      });
    }),
  
  /**
   * Get a campaign by ID
   */
  getById: protectedProcedure
    .input(campaignSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      const campaign = await ctx.prisma.campaign.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, name: true, userId: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          platforms: {
            select: { id: true, name: true, type: true }
          }
        }
      });
      
      if (!campaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }
      
      // Check if the user has access to this campaign
      if (user.role !== 'ADMIN' && campaign.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this campaign',
        });
      }
      
      return campaign;
    }),
  
  /**
   * Create a new campaign
   */
  create: managerProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, platformIds, startDate, endDate, ...rest } = input;
      
      // Check client access
      if (user.role !== 'ADMIN') {
        const client = await ctx.prisma.client.findUnique({
          where: { id: clientId },
        });
        
        if (!client || client.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to create campaigns for this client',
          });
        }
      }
      
      // Create the campaign
      const campaign = await ctx.prisma.campaign.create({
        data: {
          ...rest,
          clientId,
          createdById: userId as string,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          // Connect platforms if provided
          ...(platformIds && platformIds.length > 0 && {
            platforms: {
              connect: platformIds.map(id => ({ id })),
            },
          }),
        },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          platforms: {
            select: { id: true, name: true, type: true }
          }
        }
      });
      
      return campaign;
    }),
  
  /**
   * Update a campaign
   */
  update: managerProcedure
    .input(updateCampaignSchema.extend({ id: campaignSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const { id, platformIds, startDate, endDate, ...data } = input;
      const { userId, user } = ctx;
      
      // First check if the campaign exists and if the user can modify it
      const existingCampaign = await ctx.prisma.campaign.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          },
          platforms: true
        }
      });
      
      if (!existingCampaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingCampaign.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this campaign',
        });
      }
      
      // Update the campaign
      const updatedCampaign = await ctx.prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          // Convert string dates to Date objects if provided
          ...(startDate && { startDate: new Date(startDate) }),
          ...(endDate && { endDate: new Date(endDate) }),
          // Update platform connections if provided
          ...(platformIds && {
            platforms: {
              set: platformIds.map(platformId => ({ id: platformId })),
            },
          }),
        },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          platforms: {
            select: { id: true, name: true, type: true }
          }
        }
      });
      
      return updatedCampaign;
    }),
  
  /**
   * Delete a campaign
   */
  delete: managerProcedure
    .input(campaignSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      // First check if the campaign exists and if the user can delete it
      const existingCampaign = await ctx.prisma.campaign.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          }
        }
      });
      
      if (!existingCampaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingCampaign.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this campaign',
        });
      }
      
      // Delete campaign
      await ctx.prisma.campaign.delete({
        where: { id },
      });
      
      return { success: true };
    }),
    
  /**
   * Update campaign status
   */
  updateStatus: managerProcedure
    .input(campaignSchema.pick({ id: true, status: true }))
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      const { userId, user } = ctx;
      
      // First check if the campaign exists and if the user can modify it
      const existingCampaign = await ctx.prisma.campaign.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          }
        }
      });
      
      if (!existingCampaign) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campaign not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingCampaign.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this campaign',
        });
      }
      
      // Update the campaign status
      const updatedCampaign = await ctx.prisma.campaign.update({
        where: { id },
        data: { status },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          },
          platforms: {
            select: { id: true, name: true, type: true }
          }
        }
      });
      
      return updatedCampaign;
    }),
}); 