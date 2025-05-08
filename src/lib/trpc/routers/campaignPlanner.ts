import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';

// Unified campaign item schema for consistent typing
export const campaignItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(['post', 'dm', 'experiment']),
  platform: z.string(),
  scheduledFor: z.date(),
  status: z.enum(['scheduled', 'sending', 'sent', 'failed', 'draft']),
  content: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  recipientCount: z.number().optional(),
  experimentVariant: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CampaignItem = z.infer<typeof campaignItemSchema>;

// Helper to map database entities to unified campaign items
const mapToCampaignItem = (
  item: any,
  type: 'post' | 'dm' | 'experiment'
): CampaignItem => {
  if (type === 'post') {
    return {
      id: item.id,
      title: item.caption?.substring(0, 50) || 'Untitled Post',
      type: 'post',
      platform: item.platform,
      scheduledFor: item.scheduledAt,
      status: item.status,
      content: item.caption,
      mediaUrls: item.mediaUrls || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } else if (type === 'dm') {
    return {
      id: item.id,
      title: item.message?.substring(0, 50) || 'Untitled DM',
      type: 'dm',
      platform: item.platform,
      scheduledFor: item.scheduledAt,
      status: item.status,
      content: item.message,
      recipientCount: item.recipientCount || 0,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  } else {
    // Handle experiment type
    return {
      id: item.id,
      title: item.name || 'Untitled Experiment',
      type: 'experiment',
      platform: item.platform,
      scheduledFor: item.startDate,
      status: item.status,
      experimentVariant: item.variant,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
};

// Helper function to get all campaign items for a client
export const getAllCampaignItems = async (clientId: string) => {
  try {
    // Fetch scheduled posts
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: { clientId },
      orderBy: { scheduledAt: 'asc' },
    });

    // Fetch auto DM tasks
    const autoDMTasks = await prisma.autoDMTask.findMany({
      where: { clientId },
      orderBy: { scheduledAt: 'asc' },
    });

    // Fetch campaign experiments
    const campaignExperiments = await prisma.campaignExperiment.findMany({
      where: { clientId },
      orderBy: { startDate: 'asc' },
    });

    // Map each entity type to a unified campaign item
    const posts = scheduledPosts.map(post => mapToCampaignItem(post, 'post'));
    const dms = autoDMTasks.map(dm => mapToCampaignItem(dm, 'dm'));
    const experiments = campaignExperiments.map(exp => mapToCampaignItem(exp, 'experiment'));

    // Combine all items and sort by scheduled time
    return [...posts, ...dms, ...experiments].sort((a, b) => 
      a.scheduledFor.getTime() - b.scheduledFor.getTime()
    );
  } catch (error) {
    console.error('Error fetching campaign items:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to fetch campaign items',
    });
  }
};

export const campaignPlannerRouter = router({
  // Get all campaign items for the client
  getCampaignSchedule: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      platform: z.string().optional(),
      type: z.enum(['post', 'dm', 'experiment']).optional(),
      status: z.enum(['scheduled', 'sending', 'sent', 'failed', 'draft']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const allItems = await getAllCampaignItems(input.clientId);
        
        // Apply filters if provided
        return allItems.filter(item => {
          // Date range filter
          if (input.startDate && item.scheduledFor < input.startDate) return false;
          if (input.endDate && item.scheduledFor > input.endDate) return false;
          
          // Platform filter
          if (input.platform && item.platform !== input.platform) return false;
          
          // Type filter
          if (input.type && item.type !== input.type) return false;
          
          // Status filter
          if (input.status && item.status !== input.status) return false;
          
          return true;
        });
      } catch (error) {
        console.error('Error in getCampaignSchedule:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch campaign schedule',
        });
      }
    }),

  // Update a campaign item's schedule or status
  updateCampaignItem: protectedProcedure
    .input(z.object({
      id: z.string(),
      type: z.enum(['post', 'dm', 'experiment']),
      scheduledFor: z.date().optional(),
      status: z.enum(['scheduled', 'sending', 'sent', 'failed', 'draft']).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { id, type } = input;
        
        if (type === 'post') {
          await prisma.scheduledPost.update({
            where: { id },
            data: {
              ...(input.scheduledFor && { scheduledAt: input.scheduledFor }),
              ...(input.status && { status: input.status }),
            },
          });
        } else if (type === 'dm') {
          await prisma.autoDMTask.update({
            where: { id },
            data: {
              ...(input.scheduledFor && { scheduledAt: input.scheduledFor }),
              ...(input.status && { status: input.status }),
            },
          });
        } else if (type === 'experiment') {
          await prisma.campaignExperiment.update({
            where: { id },
            data: {
              ...(input.scheduledFor && { startDate: input.scheduledFor }),
              ...(input.status && { status: input.status }),
            },
          });
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error updating campaign item:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update campaign item',
        });
      }
    }),
}); 