import { router } from "./server";
import { userRouter } from "./routers/user";
import { clientRouter } from "./routers/client";
import { analyticsRouter } from "./routers/analytics";
import { platformConnectionsRouter } from "./routers/platformConnections";

/**
 * Root tRPC router
 * This contains all API endpoints
 */
export const appRouter = router({
  user: userRouter,
  client: clientRouter,
  analytics: analyticsRouter,
  platformConnections: platformConnectionsRouter,
});

export type AppRouter = typeof appRouter; 