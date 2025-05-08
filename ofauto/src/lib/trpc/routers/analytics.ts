import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { TransactionType } from "@prisma/client";
import { router, protectedProcedure } from "../server";
import { getAnalyticsService } from "@/lib/analytics";
import { AnalyticsPeriod } from "@/lib/analytics/types";

// Zod schema for date period
const periodSchema = z.enum(["daily", "weekly", "monthly"] as const);

// Zod schema for analytics filter options
const filterOptionsSchema = z.object({
  clientId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  period: periodSchema.optional(),
  platformId: z.string().optional(),
});

// Zod schema for engagement event
const engagementEventSchema = z.object({
  clientId: z.string(),
  platformId: z.string(),
  date: z.date().default(() => new Date()),
  eventType: z.enum(["follower", "like", "comment", "share", "view", "message"] as const),
  count: z.number().int().positive(),
});

// Zod schema for financial event
const financialEventSchema = z.object({
  clientId: z.string(),
  date: z.date().default(() => new Date()),
  transactionType: z.nativeEnum(TransactionType),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  description: z.string().optional(),
});

export const analyticsRouter = router({
  /**
   * Track an engagement event
   */
  trackEngagement: protectedProcedure
    .input(engagementEventSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can track metrics for any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to track metrics for this client",
        });
      }

      // Track the engagement event
      const analyticsService = getAnalyticsService();
      await analyticsService.trackEngagementEvent(input);

      return { success: true };
    }),

  /**
   * Track a financial event
   */
  trackFinancial: protectedProcedure
    .input(financialEventSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins and managers can track financial metrics
      if (user.role !== "ADMIN" && user.role !== "MANAGER" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to track financial metrics for this client",
        });
      }

      // Track the financial event
      const analyticsService = getAnalyticsService();
      await analyticsService.trackFinancialEvent(input);

      return { success: true };
    }),

  /**
   * Get dashboard metrics for a client
   */
  getDashboardMetrics: protectedProcedure
    .input(filterOptionsSchema)
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can view metrics for any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view metrics for this client",
        });
      }

      // Get default date range if not provided
      let { startDate, endDate, period } = input;
      
      if (!startDate || !endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        startDate = startDate || thirtyDaysAgo;
        endDate = endDate || today;
      }
      
      // Get dashboard metrics
      const analyticsService = getAnalyticsService();
      return analyticsService.getDashboardMetrics({
        clientId,
        startDate,
        endDate,
        period: period as AnalyticsPeriod,
      });
    }),

  /**
   * Get revenue time series data
   */
  getRevenueTimeSeries: protectedProcedure
    .input(filterOptionsSchema)
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can view metrics for any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view metrics for this client",
        });
      }

      // Get default date range if not provided
      let { startDate, endDate, period } = input;
      
      if (!startDate || !endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        startDate = startDate || thirtyDaysAgo;
        endDate = endDate || today;
      }
      
      // Get time series data
      const analyticsService = getAnalyticsService();
      return analyticsService.getRevenueTimeSeries({
        clientId,
        startDate,
        endDate,
        period: period as AnalyticsPeriod,
      });
    }),

  /**
   * Get engagement time series data
   */
  getEngagementTimeSeries: protectedProcedure
    .input(filterOptionsSchema)
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can view metrics for any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view metrics for this client",
        });
      }

      // Get default date range if not provided
      let { startDate, endDate, period } = input;
      
      if (!startDate || !endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        startDate = startDate || thirtyDaysAgo;
        endDate = endDate || today;
      }
      
      // Get time series data
      const analyticsService = getAnalyticsService();
      return analyticsService.getEngagementTimeSeries({
        clientId,
        startDate,
        endDate,
        period: period as AnalyticsPeriod,
      });
    }),
}); 