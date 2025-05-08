import { router, protectedProcedure } from "../server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateRevenueInsights } from "@/lib/services/reasoningService";
import { prisma } from "@/lib/db/prisma";

export const insightsRouter = router({
  /**
   * Get AI-generated insights for a client
   */
  getInsights: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Check if user has access to this client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can access any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this client's insights",
        });
      }

      // Generate insights
      const insights = await generateRevenueInsights(clientId);
      
      return insights;
    }),
  
  /**
   * Get AI-generated insights for a specific platform
   */
  getPlatformInsights: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        platformType: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId, platformType } = input;

      // Check if user has access to this client
      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }

      // Admins can access any client, otherwise check if user owns the client
      if (user.role !== "ADMIN" && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to access this client's insights",
        });
      }

      // Generate insights with platform filter
      // For now, we just generate all insights then filter for the platform
      // In a future update, we could pass the platform to the insight generator
      const allInsights = await generateRevenueInsights(clientId);
      
      // Simple filtering, to be improved in future versions
      // This is a naive approach for now
      const filteredInsights = allInsights.filter(insight => 
        insight.description.toLowerCase().includes(platformType.toLowerCase())
      );
      
      return filteredInsights;
    })
}); 