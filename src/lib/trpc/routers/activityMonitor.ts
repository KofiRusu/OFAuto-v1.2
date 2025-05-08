import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { UserRole } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import {
  GetActivityFeedSchema,
  AddActivityLogSchema,
  ActivityLogSchema,
  UserStatsSchema,
  GetModelActivitySchema,
  ActivityLogCreateSchema
} from '@/lib/schemas/activityMonitor';

const prisma = new PrismaClient();

// Create a manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user's role is either MANAGER or ADMIN from the request headers
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
      // Add any additional context needed by manager-only procedures
    },
  });
});

export const activityMonitorRouter = createTRPCRouter({
  /**
   * Get paginated activity feed with filters
   * Restricted to MANAGER and ADMIN
   */
  getActivityFeed: managerProcedure
    .input(GetActivityFeedSchema)
    .query(async ({ input, ctx }) => {
      try {
        const {
          page,
          limit,
          userId,
          actionType,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        } = input;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: any = {};
        
        if (userId) {
          where.userId = userId;
        }
        
        if (actionType) {
          where.actionType = actionType;
        }
        
        if (startDate || endDate) {
          where.timestamp = {};
          if (startDate) {
            where.timestamp.gte = startDate;
          }
          if (endDate) {
            where.timestamp.lte = endDate;
          }
        }

        // Query activity logs with pagination and filters
        const [activityLogs, totalCount] = await Promise.all([
          prisma.activityLog.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              [sortBy]: sortOrder,
            },
            skip,
            take: limit,
          }),
          prisma.activityLog.count({ where }),
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        return {
          success: true,
          data: activityLogs,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasMore,
          },
        };
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity feed',
          cause: error,
        });
      }
    }),

  /**
   * Get user activity statistics
   * Restricted to MANAGER and ADMIN
   */
  getUserStats: managerProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const { userId } = input;

        // Get user to verify existence
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID ${userId} not found`,
          });
        }

        // Calculate total actions
        const totalActions = await prisma.activityLog.count({
          where: { userId },
        });

        // Get actions by type
        const actionsByTypeRaw = await prisma.activityLog.groupBy({
          by: ['actionType'],
          where: { userId },
          _count: {
            actionType: true,
          },
        });

        const actionsByType = actionsByTypeRaw.reduce((acc, curr) => {
          acc[curr.actionType] = curr._count.actionType;
          return acc;
        }, {} as Record<string, number>);

        // Get most recent action
        const mostRecentAction = await prisma.activityLog.findFirst({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Get activity by day (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activityByDayRaw = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
          SELECT 
            DATE_TRUNC('day', "timestamp") as date,
            COUNT(*) as count
          FROM "ActivityLog"
          WHERE "userId" = ${userId}
            AND "timestamp" >= ${thirtyDaysAgo}
          GROUP BY DATE_TRUNC('day', "timestamp")
          ORDER BY date ASC
        `;

        // Format the response
        const userStats = {
          totalActions,
          actionsByType,
          mostRecentAction: mostRecentAction || undefined,
          activityByDay: activityByDayRaw.map(day => ({
            date: day.date.toString(),
            count: Number(day.count),
          })),
        };

        return {
          success: true,
          stats: userStats,
        };
      } catch (error) {
        console.error(`Error fetching user stats for ${input.userId}:`, error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user statistics',
          cause: error,
        });
      }
    }),

  /**
   * Add a new activity log
   * This is an internal procedure that can be used by other parts of the system
   */
  addActivityLog: protectedProcedure
    .input(AddActivityLogSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { userId, actionType, description, metadata } = input;

        // Create new activity log
        const activityLog = await prisma.activityLog.create({
          data: {
            userId,
            actionType,
            description,
            metadata: metadata || undefined,
          },
        });

        return {
          success: true,
          activityLog,
        };
      } catch (error) {
        console.error('Error adding activity log:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add activity log',
          cause: error,
        });
      }
    }),

  /**
   * Get activity logs for a specific model
   * Restricted to MANAGER and ADMIN
   */
  getModelActivity: managerProcedure
    .input(GetModelActivitySchema)
    .query(async ({ input, ctx }) => {
      try {
        // Create the base query
        const whereClause: any = {
          userId: input.modelId,
        };

        // Add date range filter if provided
        if (input.dateRange) {
          whereClause.createdAt = {};
          
          if (input.dateRange.start) {
            whereClause.createdAt.gte = input.dateRange.start;
          }
          
          if (input.dateRange.end) {
            whereClause.createdAt.lte = input.dateRange.end;
          }
        }

        // Add action types filter if provided
        if (input.actionTypes && input.actionTypes.length > 0) {
          whereClause.actionType = {
            in: input.actionTypes,
          };
        }

        // Count total matching records
        const total = await prisma.activityLog.count({
          where: whereClause,
        });

        // Get paginated activity logs
        const activityLogs = await prisma.activityLog.findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          skip: input.offset,
          take: input.limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          logs: activityLogs,
          total,
          offset: input.offset,
          limit: input.limit,
        };
      } catch (error) {
        console.error('Error fetching model activity logs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity logs',
          cause: error,
        });
      }
    }),

  /**
   * Log an activity (internal procedure)
   */
  logActivity: protectedProcedure
    .input(ActivityLogCreateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const activityLog = await prisma.activityLog.create({
          data: {
            userId: input.userId,
            actionType: input.actionType,
            metadata: input.metadata || {},
          },
        });

        return {
          success: true,
          activityLog,
        };
      } catch (error) {
        console.error('Error logging activity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to log activity',
          cause: error,
        });
      }
    }),
}); 