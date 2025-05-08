import { z } from "zod";
import { publicProcedure, router, protectedProcedure } from "@/lib/trpc/trpc";
import { AutoDMEngine } from "@/services/autoDMEngine";
import { logger } from "@/lib/logger";

// Initialize AutoDMEngine
const autoDMEngine = new AutoDMEngine();

export const dmCampaignsRouter = router({
  // Record an event for a message (open, response, conversion)
  recordEvent: protectedProcedure
    .input(z.object({
      messageId: z.string(),
      event: z.enum(['open', 'response', 'conversion'])
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // For production, we'd use ctx.prisma to access the database
        // For now, we'll use the AutoDMEngine directly
        const result = await autoDMEngine.recordEvent(input.messageId, input.event);
        return { success: result };
      } catch (err) {
        logger.error("Error recording DM event:", err);
        throw new Error(`Failed to record DM event: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  // Get metrics for a specific campaign
  getCampaignMetrics: protectedProcedure
    .input(z.object({ 
      campaignId: z.string(),
      platformId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // For production, we'd use ctx.prisma to query the database
        // For now, we'll use the AutoDMEngine directly
        const metrics = autoDMEngine.getCampaignMetrics(input.campaignId, input.platformId);
        return metrics;
      } catch (err) {
        logger.error("Error fetching campaign metrics:", err);
        throw new Error(`Failed to fetch campaign metrics: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  // Get all metrics
  getAllMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // For production, we'd use ctx.prisma to query the database
        // For now, we'll use the AutoDMEngine directly
        const metrics = autoDMEngine.getMetrics();
        return metrics;
      } catch (err) {
        logger.error("Error fetching all metrics:", err);
        throw new Error(`Failed to fetch all metrics: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  // Get all campaigns
  getAllCampaigns: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // For production, we'd use ctx.prisma to query the database
        // For now, we'll use the AutoDMEngine directly
        const campaigns = autoDMEngine.getCampaigns();
        return campaigns;
      } catch (err) {
        logger.error("Error fetching campaigns:", err);
        throw new Error(`Failed to fetch campaigns: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),

  // Get messages for a campaign
  getCampaignMessages: protectedProcedure
    .input(z.object({ 
      campaignId: z.string(),
      status: z.string().optional(),
      platformId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        // For production, we'd use ctx.prisma to query the database
        // For now, we'll use the AutoDMEngine directly
        const messages = autoDMEngine.getMessages({
          campaignId: input.campaignId,
          status: input.status,
          platformId: input.platformId
        });
        return messages;
      } catch (err) {
        logger.error("Error fetching campaign messages:", err);
        throw new Error(`Failed to fetch campaign messages: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
}); 