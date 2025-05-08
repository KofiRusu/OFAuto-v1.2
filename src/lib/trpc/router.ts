import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { router } from "./server";
import { userRouter } from "./routers/user";
import { analyticsRouter } from "./routers/analytics";
import { platformRouter } from "./routers/platform";
import { insightsRouter } from "./routers/insights";
import { campaignPlannerRouter } from './routers/campaignPlanner';
import { scheduledPostRouter } from './routers/scheduledPost';
import { autoDMRouter } from './routers/autoDM';
import { dmCampaignsRouter } from './routers/dmCampaigns';
import { commentsRouter } from './routers/comments';
import { onboardingRouter } from './routers/onboarding';
import { kycReviewRouter } from './routers/kycReview';
import { filesRouter } from './routers/files';
import { contractRouter } from './routers/contract';
import { kycDocumentRouter } from './routers/kycDocument';
import { mediaRouter } from './routers/media';
import { trendRouter } from './routers/trend';
import { complianceRouter } from "./routers/compliance";
import { quickBooksRouter } from "./routers/quickbooks";
import { crmRouter } from "./routers/crm";
import { taxFormRouter } from "./routers/taxForm";
import { chatbotAutomationRouter } from "./routers/chatbotAutomation";
import { activityMonitorRouter } from "./routers/activityMonitor";
import { financialMonitorRouter } from "./routers/financialMonitor";
import { driveRouter } from "./routers/drive";
import { performanceRouter } from "./routers/performance";
import { platformAccessRouter } from "./routers/platformAccess";
import { notificationsRouter } from "./routers/notifications";
import { organizationRouter } from "./routers/organization";
import { kpiRouter } from "./routers/kpi";
import { linktreeRouter } from "./routers/linktree";
import { campaignChatbotRouter } from "./routers/campaignChatbot";
import { authRouter } from "./routers/auth";

// Initialize tRPC backend
const t = initTRPC.create();

// Client router
const clientRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional().or(z.literal("")),
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // This would normally connect to a database
      console.log('Creating client:', input);
      
      // Mock implementation
      return {
        id: `client-${Math.random().toString(36).substr(2, 9)}`,
        ...input,
        createdAt: new Date(),
      };
    }),
});

/**
 * Root tRPC router
 * This contains all API endpoints
 */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  analytics: analyticsRouter,
  platform: platformRouter,
  insights: insightsRouter,
  campaignPlanner: campaignPlannerRouter,
  autoDM: autoDMRouter,
  scheduledPost: scheduledPostRouter,
  dmCampaigns: dmCampaignsRouter,
  comments: commentsRouter,
  client: clientRouter,
  onboarding: onboardingRouter,
  kycReview: kycReviewRouter,
  files: filesRouter,
  contract: contractRouter,
  kycDocument: kycDocumentRouter,
  media: mediaRouter,
  trend: trendRouter,
  compliance: complianceRouter,
  quickBooks: quickBooksRouter,
  crm: crmRouter,
  taxForm: taxFormRouter,
  chatbotAutomation: chatbotAutomationRouter,
  activityMonitor: activityMonitorRouter,
  financialMonitor: financialMonitorRouter,
  drive: driveRouter,
  performance: performanceRouter,
  platformAccess: platformAccessRouter,
  notifications: notificationsRouter,
  organization: organizationRouter,
  kpi: kpiRouter,
  linktree: linktreeRouter,
  campaignChatbot: campaignChatbotRouter,
});

export type AppRouter = typeof appRouter; 