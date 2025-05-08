import { PrismaClient } from "@prisma/client";
import { StrategyService } from "./strategy-service";
import { prisma } from "@/lib/db/prisma";

// Singleton instance of the strategy service
let strategyService: StrategyService | null = null;

// Get or create the strategy service
export function getStrategyService(): StrategyService {
  if (!strategyService) {
    strategyService = new StrategyService(prisma);
  }
  
  return strategyService;
}

// Re-export types
export * from "./types"; 