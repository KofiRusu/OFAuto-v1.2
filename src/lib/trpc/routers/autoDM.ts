import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../server";
import { AutoDMCampaignStatus } from "@prisma/client";

// Schema for creating/updating Auto-DM campaigns
const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.nativeEnum(AutoDMCampaignStatus),
  platformId: z.string().min(1, "Platform is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  messageTemplate: z.string().min(1, "Message template is required"),
  imageUrl: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  frequency: z.number().min(1).max(20),
});

export const autoDMRouter = router({
  // Get all campaigns with optional status filter
  getAll: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(AutoDMCampaignStatus).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;

      // Get user and check if exists
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Build filter based on user role and input
      const filter: any = {};

      // Filter by status if provided
      if (input?.status) {
        filter.status = input.status;
      }

      // Only show campaigns for the current client if not an admin
      if (user.role !== "ADMIN" && user.clientId) {
        // Find platforms belonging to the client
        const clientPlatforms = await prisma.platform.findMany({
          where: { clientId: user.clientId },
          select: { id: true },
        });

        // Filter campaigns by these platforms
        filter.platformId = {
          in: clientPlatforms.map((p) => p.id),
        };
      }

      // Get campaigns with platform details
      const campaigns = await prisma.autoDMCampaign.findMany({
        where: filter,
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return campaigns;
    }),

  // Get a single campaign by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Get campaign with platform details
      const campaign = await prisma.autoDMCampaign.findUnique({
        where: { id: input.id },
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              type: true,
              clientId: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user has access to this campaign
      if (
        user.role !== "ADMIN" &&
        user.clientId &&
        campaign.platform.clientId !== user.clientId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this campaign",
        });
      }

      return campaign;
    }),

  // Create a new campaign
  create: protectedProcedure
    .input(campaignSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Verify platform exists and user has access to it
      const platform = await prisma.platform.findUnique({
        where: { id: input.platformId },
        select: { id: true, clientId: true },
      });

      if (!platform) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selected platform does not exist",
        });
      }

      // If user is not admin, check platform belongs to their client
      if (
        user.role !== "ADMIN" &&
        user.clientId &&
        platform.clientId !== user.clientId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this platform",
        });
      }

      // Create the campaign
      const campaign = await prisma.autoDMCampaign.create({
        data: {
          name: input.name,
          status: input.status,
          targetAudience: input.targetAudience,
          messageTemplate: input.messageTemplate,
          imageUrl: input.imageUrl,
          startDate: input.startDate,
          endDate: input.endDate,
          frequency: input.frequency,
          totalMessages: 0, // Initialize with 0 messages
          sentMessages: 0, // Initialize with 0 sent messages
          platformId: input.platformId,
          createdById: user.id,
        },
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return campaign;
    }),

  // Update an existing campaign
  update: protectedProcedure
    .input(
      campaignSchema.extend({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;
      const { id, ...data } = input;

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Fetch existing campaign to check access
      const existingCampaign = await prisma.autoDMCampaign.findUnique({
        where: { id },
        include: {
          platform: {
            select: {
              clientId: true,
            },
          },
        },
      });

      if (!existingCampaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user has access to update this campaign
      if (
        user.role !== "ADMIN" &&
        user.clientId &&
        existingCampaign.platform.clientId !== user.clientId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to update this campaign",
        });
      }

      // Update the campaign
      const updatedCampaign = await prisma.autoDMCampaign.update({
        where: { id },
        data: {
          name: data.name,
          status: data.status,
          targetAudience: data.targetAudience,
          messageTemplate: data.messageTemplate,
          imageUrl: data.imageUrl,
          startDate: data.startDate,
          endDate: data.endDate,
          frequency: data.frequency,
          platformId: data.platformId,
          updatedAt: new Date(),
        },
        include: {
          platform: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return updatedCampaign;
    }),

  // Update just the status of a campaign
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(AutoDMCampaignStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Fetch existing campaign to check access
      const existingCampaign = await prisma.autoDMCampaign.findUnique({
        where: { id: input.id },
        include: {
          platform: {
            select: {
              clientId: true,
            },
          },
        },
      });

      if (!existingCampaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user has access to update this campaign
      if (
        user.role !== "ADMIN" &&
        user.clientId &&
        existingCampaign.platform.clientId !== user.clientId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to update this campaign",
        });
      }

      // Update just the status
      const updatedCampaign = await prisma.autoDMCampaign.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updatedAt: new Date(),
        },
      });

      return updatedCampaign;
    }),

  // Delete a campaign
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth } = ctx;
      const userId = auth.userId;

      // Get user
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, role: true, clientId: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      // Fetch campaign to check access
      const campaign = await prisma.autoDMCampaign.findUnique({
        where: { id: input.id },
        include: {
          platform: {
            select: {
              clientId: true,
            },
          },
        },
      });

      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        });
      }

      // Check if user has access to delete this campaign
      if (
        user.role !== "ADMIN" &&
        user.clientId &&
        campaign.platform.clientId !== user.clientId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to delete this campaign",
        });
      }

      // Delete the campaign
      await prisma.autoDMCampaign.delete({
        where: { id: input.id },
      });

      return { success: true, id: input.id };
    }),
}); 