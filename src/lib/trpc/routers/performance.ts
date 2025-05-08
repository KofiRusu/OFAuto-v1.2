import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  PerformanceReportCreateSchema,
  GetPerformanceReportsSchema
} from '@/lib/schemas/performance';

const prisma = new PrismaClient();

// Create manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user's role is either MANAGER or ADMIN
  const userRole = ctx.auth.userRole;

  if (userRole !== UserRole.MANAGER && userRole !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only managers and administrators can access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
    },
  });
});

export const performanceRouter = createTRPCRouter({
  /**
   * Generate a performance report for a model
   * Restricted to MANAGER and ADMIN
   */
  generateReport: managerProcedure
    .input(PerformanceReportCreateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify the model exists
        const model = await prisma.user.findUnique({
          where: { id: input.modelId },
        });

        if (!model) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Model with ID ${input.modelId} not found`,
          });
        }

        // Create the performance report
        const report = await prisma.performanceReport.create({
          data: {
            modelId: input.modelId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            metrics: input.metrics,
          },
          include: {
            model: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return report;
      } catch (error) {
        console.error('Error generating performance report:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate performance report',
          cause: error,
        });
      }
    }),

  /**
   * List performance reports, optionally filtered by model
   * Restricted to MANAGER and ADMIN
   */
  listReports: managerProcedure
    .input(GetPerformanceReportsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Create the base query
        const whereClause: any = {};

        // Filter by model if provided
        if (input.modelId) {
          whereClause.modelId = input.modelId;
        }

        // Add date range filter if provided
        if (input.dateRange) {
          // Filter by periodStart and periodEnd
          if (input.dateRange.start) {
            whereClause.periodEnd = {
              ...whereClause.periodEnd,
              gte: input.dateRange.start,
            };
          }
          
          if (input.dateRange.end) {
            whereClause.periodStart = {
              ...whereClause.periodStart,
              lte: input.dateRange.end,
            };
          }
        }

        // Count total matching records
        const total = await prisma.performanceReport.count({
          where: whereClause,
        });

        // Get paginated reports
        const reports = await prisma.performanceReport.findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          skip: input.offset,
          take: input.limit,
          include: {
            model: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          reports,
          total,
          offset: input.offset,
          limit: input.limit,
        };
      } catch (error) {
        console.error('Error fetching performance reports:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance reports',
          cause: error,
        });
      }
    }),
}); 