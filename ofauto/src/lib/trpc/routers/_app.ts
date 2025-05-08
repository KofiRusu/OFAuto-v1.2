import { router } from "@/lib/trpc/trpc";
import { platformConnectionsRouter } from "./platformConnections";
import { insightsRouter } from "./insights";
import { marketingRouter } from "./marketingRouter";

export const appRouter = router({
  platformConnections: platformConnectionsRouter,
  insights: insightsRouter,
  marketing: marketingRouter,
});

export type AppRouter = typeof appRouter; 