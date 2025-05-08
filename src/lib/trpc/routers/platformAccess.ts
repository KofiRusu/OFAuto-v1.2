import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { TRPCError } from '@trpc/server';
import { PrismaClient, UserRole } from '@prisma/client';
import {
  GetUserPlatformsSchema,
  PlatformAccessUpdateSchema,
} from '@/lib/schemas/platformAccess';

const prisma = new PrismaClient();

// Create a manager-only procedure
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
      // Add any additional context needed by manager-only procedures
    },
  });
});

export const platformAccessRouter = createTRPCRouter({
  /**
   * Get platforms for a user (defaults to current user)
   * If requesting other users' platforms, caller must be a MANAGER or ADMIN
   */
  getUserPlatforms: protectedProcedure
    .input(GetUserPlatformsSchema)
    .query(async ({ input, ctx }) => {
      try {
        const requestingUserId = ctx.auth.userId;
        const targetUserId = input.userId || requestingUserId;
        
        // If requesting data for another user, check if requester is a manager/admin
        if (targetUserId !== requestingUserId && ctx.auth.userRole !== UserRole.MANAGER && ctx.auth.userRole !== UserRole.ADMIN) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own platform access',
          });
        }

        // Construct query to find platform access records
        const whereClause: any = {
          userId: targetUserId,
        };

        // If not including unapproved platforms and not a manager/admin,
        // filter to only approved platforms
        if (!input.includeUnapproved && ctx.auth.userRole !== UserRole.MANAGER && ctx.auth.userRole !== UserRole.ADMIN) {
          whereClause.approved = true;
        }

        // Get platform access records with platform details
        const platformAccess = await prisma.platformAccess.findMany({
          where: whereClause,
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                type: true,
                username: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          platformAccess,
        };
      } catch (error) {
        console.error('Error fetching user platforms:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch platform access',
          cause: error,
        });
      }
    }),

  /**
   * Set platform approval status
   * Restricted to MANAGER and ADMIN
   */
  setPlatformApproval: managerProcedure
    .input(PlatformAccessUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if platform exists
        const platform = await prisma.platform.findUnique({
          where: { id: input.platformId },
        });

        if (!platform) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Platform with ID ${input.platformId} not found`,
          });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID ${input.userId} not found`,
          });
        }

        // Create or update platform access record
        const platformAccess = await prisma.platformAccess.upsert({
          where: {
            userId_platformId: {
              userId: input.userId,
              platformId: input.platformId,
            },
          },
          update: {
            approved: input.approved,
          },
          create: {
            userId: input.userId,
            platformId: input.platformId,
            approved: input.approved,
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                type: true,
                username: true,
                status: true,
              },
            },
          },
        });

        // Log activity for audit trail
        await prisma.activityLog.create({
          data: {
            userId: ctx.auth.userId,
            actionType: input.approved ? 'PLATFORM_ACCESS_APPROVED' : 'PLATFORM_ACCESS_DENIED',
            metadata: {
              platformId: input.platformId,
              platformName: platform.name,
              targetUserId: input.userId,
              targetUserName: user.name,
            },
          },
        });

        return platformAccess;
      } catch (error) {
        console.error('Error setting platform approval:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update platform access',
          cause: error,
        });
      }
    }),

  /**
   * Initialize platform access for a user
   * Creates platform access records for all platforms that don't have one yet
   * Restricted to MANAGER and ADMIN
   */
  initializePlatformAccess: managerProcedure
    .input(z.object({
      userId: z.string(),
      defaultApproval: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with ID ${input.userId} not found`,
          });
        }

        // Get all platforms
        const platforms = await prisma.platform.findMany();
        
        // Get existing platform access records for the user
        const existingAccess = await prisma.platformAccess.findMany({
          where: { userId: input.userId },
        });
        
        // Identify platforms that don't have access records yet
        const existingPlatformIds = new Set(existingAccess.map(a => a.platformId));
        const platformsToAdd = platforms.filter(p => !existingPlatformIds.has(p.id));
        
        // Create new platform access records
        if (platformsToAdd.length > 0) {
          await prisma.platformAccess.createMany({
            data: platformsToAdd.map(platform => ({
              userId: input.userId,
              platformId: platform.id,
              approved: input.defaultApproval,
            })),
          });
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: ctx.auth.userId,
            actionType: 'PLATFORM_ACCESS_INITIALIZED',
            metadata: {
              targetUserId: input.userId,
              platformCount: platformsToAdd.length,
              defaultApproval: input.defaultApproval,
            },
          },
        });

        return {
          success: true,
          platformsInitialized: platformsToAdd.length,
        };
      } catch (error) {
        console.error('Error initializing platform access:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize platform access',
          cause: error,
        });
      }
    }),
}); 