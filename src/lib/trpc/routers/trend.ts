import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, managerProcedure, adminProcedure } from "../server";
import { 
  TrendDetectionBatchSchema, 
  RecentTrendsQuerySchema, 
  TrendMetricsQuerySchema,
  TrendSettingsSchema
} from "@/lib/schemas/trend";
import { 
  storeTrendBatch, 
  fetchAllTrends, 
  calculateBoostScore,
  generateContentSuggestions 
} from "@/lib/services/trendService";
import { z } from "zod";

export const trendRouter = router({
  /**
   * Detect and store a batch of trends (triggered by webhook or scheduled job)
   */
  detectTrends: adminProcedure
    .input(TrendDetectionBatchSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await storeTrendBatch(input);
        return { success: true };
      } catch (error) {
        ctx.logger.error('Error detecting trends', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to detect trends',
          cause: error,
        });
      }
    }),

  /**
   * Manually trigger trend detection from all configured sources
   */
  refreshTrends: managerProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Fetch trends from all sources
        const trends = await fetchAllTrends();
        
        // Store the trends in the database
        await storeTrendBatch(trends);
        
        return { 
          success: true, 
          trendsDetected: trends.trends.length 
        };
      } catch (error) {
        ctx.logger.error('Error refreshing trends', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh trends',
          cause: error,
        });
      }
    }),

  /**
   * Get recent trends with optional filtering
   */
  getRecentTrends: protectedProcedure
    .input(RecentTrendsQuerySchema)
    .query(async ({ ctx, input }) => {
      const { limit, source, since } = input;
      
      try {
        // Build the where clause
        const where: any = {};
        
        if (source) {
          where.source = source;
        }
        
        if (since) {
          where.detectedAt = {
            gte: new Date(since)
          };
        }
        
        // Get trends with their metrics
        const trends = await ctx.prisma.trend.findMany({
          where,
          orderBy: {
            detectedAt: 'desc'
          },
          take: limit,
          include: {
            metrics: {
              orderBy: {
                timestamp: 'desc'
              },
              take: 1, // Just get the most recent metric for each trend
            }
          }
        });
        
        // Calculate boost scores for each trend
        const trendsWithBoost = await Promise.all(
          trends.map(async (trend) => {
            const boostScore = await calculateBoostScore(trend.id);
            return {
              ...trend,
              boostScore
            };
          })
        );
        
        return {
          trends: trendsWithBoost,
          timestamp: new Date(),
        };
      } catch (error) {
        ctx.logger.error('Error getting recent trends', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get recent trends',
          cause: error,
        });
      }
    }),

  /**
   * Get time series metrics for a specific trend
   */
  getTrendMetrics: protectedProcedure
    .input(TrendMetricsQuerySchema)
    .query(async ({ ctx, input }) => {
      const { trendId, platform, timeframe } = input;
      
      try {
        // Make sure the trend exists
        const trend = await ctx.prisma.trend.findUnique({
          where: { id: trendId }
        });
        
        if (!trend) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trend not found',
          });
        }
        
        // Calculate the date range based on timeframe
        const now = new Date();
        let startDate: Date;
        
        switch (timeframe) {
          case 'hour':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case 'day':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        // Build the where clause
        const where: any = {
          trendId,
          timestamp: {
            gte: startDate
          }
        };
        
        if (platform) {
          where.platform = platform;
        }
        
        // Get trend metrics
        const metrics = await ctx.prisma.trendMetric.findMany({
          where,
          orderBy: {
            timestamp: 'asc'
          }
        });
        
        return {
          trend,
          metrics,
          timeframe
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error getting trend metrics', { error, trendId });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get trend metrics',
          cause: error,
        });
      }
    }),

  /**
   * Get content suggestions for a specific trend
   */
  getContentSuggestions: protectedProcedure
    .input(z.object({
      trendId: z.string().uuid("Invalid trend ID"),
    }))
    .query(async ({ ctx, input }) => {
      const { trendId } = input;
      
      try {
        // Get the trend
        const trend = await ctx.prisma.trend.findUnique({
          where: { id: trendId }
        });
        
        if (!trend) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trend not found',
          });
        }
        
        // Generate content suggestions
        const suggestions = await generateContentSuggestions(trendId);
        
        return {
          trend,
          suggestions,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error getting content suggestions', { error, trendId });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get content suggestions',
          cause: error,
        });
      }
    }),

  /**
   * Get trend settings (for admin panel)
   */
  getTrendSettings: adminProcedure
    .query(async ({ ctx }) => {
      try {
        // This would normally fetch from a settings table or configuration store
        // For now, return mock settings
        return {
          refreshInterval: 60, // minutes
          sources: [
            {
              name: 'Twitter',
              enabled: true,
              apiKey: '****',
              apiSecret: '****',
            },
            {
              name: 'TikTok',
              enabled: true,
              apiKey: '****',
              apiSecret: '****',
            },
            {
              name: 'Instagram',
              enabled: false,
            },
            {
              name: 'YouTube',
              enabled: false,
            }
          ],
          autoSuggestPosts: true,
          minEngagementThreshold: 0.5
        };
      } catch (error) {
        ctx.logger.error('Error getting trend settings', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get trend settings',
          cause: error,
        });
      }
    }),

  /**
   * Update trend settings (for admin panel)
   */
  updateTrendSettings: adminProcedure
    .input(TrendSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // This would normally update a settings table or configuration store
        // For now, just log the settings and return success
        ctx.logger.info('Updating trend settings', { settings: input });
        
        return { success: true };
      } catch (error) {
        ctx.logger.error('Error updating trend settings', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update trend settings',
          cause: error,
        });
      }
    }),
}); 