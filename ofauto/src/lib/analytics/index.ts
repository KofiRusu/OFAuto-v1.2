import { PrismaClient } from "@prisma/client";
import { AnalyticsService } from "./analytics-service";
import { prisma } from "@/lib/db/prisma";

// Singleton instance of the analytics service
let analyticsService: AnalyticsService | null = null;

// Get or create the analytics service
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsService) {
    analyticsService = new AnalyticsService(prisma);
  }
  
  return analyticsService;
}

// Re-export types
export * from "./types"; 