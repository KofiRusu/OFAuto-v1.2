import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { UserRole } from '@prisma/client';
import {
  GetNotificationsSchema,
  MarkReadSchema,
  MarkAllReadSchema,
  SendNotificationSchema,
  NotificationType,
} from '@/lib/schemas/notifications';
import { notificationService } from '@/lib/services/notificationService';

// Create manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user is a MANAGER or ADMIN
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

export const notificationsRouter = createTRPCRouter({
  /**
   * Get notifications for the current user
   * Supports filtering by read/unread status and notification type
   * Uses cursor-based pagination for efficient loading
   */
  getNotifications: protectedProcedure
    .input(GetNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const { auth, prisma } = ctx;
      const { limit, cursor, filterRead, filterUnread, type } = input;
      
      // Build where clause
      let whereClause: any = {
        userId: auth.userId,
      };
      
      // Apply read/unread filters
      if (filterRead === true) {
        whereClause.readAt = { not: null };
      }
      
      if (filterUnread === true) {
        whereClause.readAt = null;
      }
      
      // Apply type filter
      if (type) {
        whereClause.type = type;
      }
      
      // Get one extra item to determine if there are more items
      const notifications = await prisma.notification.findMany({
        where: whereClause,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      // Check if there are more items
      let nextCursor: string | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }
      
      // Get total count (for UI indicators)
      const totalCount = await prisma.notification.count({
        where: whereClause,
      });
      
      // Get unread count (for UI indicators)
      const unreadCount = await prisma.notification.count({
        where: {
          userId: auth.userId,
          readAt: null,
        },
      });
      
      return {
        notifications,
        nextCursor,
        totalCount,
        unreadCount,
      };
    }),
  
  /**
   * Mark specific notifications as read
   */
  markAsRead: protectedProcedure
    .input(MarkReadSchema)
    .mutation(async ({ ctx, input }) => {
      const { auth, prisma } = ctx;
      const { ids } = input;
      
      // Verify that all notifications belong to the user
      const notificationCount = await prisma.notification.count({
        where: {
          id: { in: ids },
          userId: auth.userId,
        },
      });
      
      if (notificationCount !== ids.length) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'One or more notifications do not belong to you',
        });
      }
      
      // Mark notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: auth.userId,
        },
        data: {
          readAt: new Date(),
        },
      });
      
      return {
        success: true,
        count: notificationCount,
      };
    }),
  
  /**
   * Mark all notifications as read for the current user
   */
  markAllAsRead: protectedProcedure
    .input(MarkAllReadSchema)
    .mutation(async ({ ctx, input }) => {
      const { auth, prisma } = ctx;
      const targetUserId = input.userId || auth.userId;
      
      // If trying to mark someone else's notifications, verify permissions
      if (targetUserId !== auth.userId) {
        if (auth.userRole !== UserRole.ADMIN && auth.userRole !== UserRole.MANAGER) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to mark notifications as read for other users',
          });
        }
        
        // If manager, check that the target user is a model they manage
        if (auth.userRole === UserRole.MANAGER) {
          // This is a simplified check - in reality, you'd check if the manager manages this model
          const userExists = await prisma.user.findFirst({
            where: {
              id: targetUserId,
              role: UserRole.MODEL,
            },
          });
          
          if (!userExists) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not manage this user',
            });
          }
        }
      }
      
      // Mark all unread notifications as read
      const result = await prisma.notification.updateMany({
        where: {
          userId: targetUserId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
      
      return {
        success: true,
        count: result.count,
      };
    }),
  
  /**
   * Send a notification to one or more users
   * Manager/Admin only
   */
  sendNotification: managerProcedure
    .input(SendNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const { auth, prisma, logger } = ctx;
      const { userIds, type, title, message, payload } = input;
      
      // Verify all users exist
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });
      
      if (users.length !== userIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'One or more users do not exist',
        });
      }
      
      // Log the notification
      logger.info('Sending notifications', {
        sender: auth.userId,
        recipients: userIds.length,
        type,
      });
      
      // Create notifications in the database
      const createdNotifications = await prisma.$transaction(
        userIds.map(userId => 
          prisma.notification.create({
            data: {
              userId,
              type,
              title,
              message,
              payload,
            },
          })
        )
      );
      
      // Try to send real-time notifications through the service
      try {
        await Promise.all(
          createdNotifications.map(notification => 
            notificationService.sendRealTimeNotification(notification)
          )
        );
      } catch (error) {
        // Log error but don't fail the request - notifications are still stored in DB
        logger.error('Error sending real-time notifications', { error });
      }
      
      return {
        success: true,
        count: createdNotifications.length,
        notifications: createdNotifications,
      };
    }),
  
  /**
   * Get unread notification count for the current user
   * Used for UI indicators
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const { auth, prisma } = ctx;
      
      const count = await prisma.notification.count({
        where: {
          userId: auth.userId,
          readAt: null,
        },
      });
      
      return { count };
    }),
    
  /**
   * Get recent notifications sent by the current user
   * For managers to see their notification history
   */
  getRecentSent: managerProcedure
    .query(async ({ ctx }) => {
      const { auth, prisma } = ctx;
      
      // This is a simplified implementation
      // In a real app, you would track the sender of each notification
      // Here we're using a query to mimic that functionality
      
      // Get all notifications grouped by title, message, and type
      // This simulates finding notifications sent by this user
      const recentNotifications = await prisma.$queryRaw`
        SELECT 
          n.id,
          n.type,
          n.title,
          n.message,
          n.created_at as "createdAt",
          COUNT(*) as "recipientCount"
        FROM 
          "Notification" n
        WHERE 
          n.created_at > NOW() - INTERVAL '30 days' 
        GROUP BY 
          n.type, n.title, n.message, n.id, n.created_at
        ORDER BY 
          n.created_at DESC
        LIMIT 20
      `;
      
      return recentNotifications;
    }),
}); 