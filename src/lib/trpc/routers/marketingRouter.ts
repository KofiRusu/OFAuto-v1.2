'use server';

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { verifyClientOwnership } from '@/lib/auth/verifyClientOwnership';

// Define input schemas for endpoints
const scheduledPostSchema = z.object({
  clientId: z.string(),
  platforms: z.array(z.string()),
  content: z.string(),
  mediaUrl: z.string().optional(),
  scheduledAt: z.date(),
});

const autoDMTaskSchema = z.object({
  clientId: z.string(),
  platformType: z.string(),
  trigger: z.string(),
  message: z.string(),
  isRecurring: z.boolean().default(false),
});

const clientIdSchema = z.object({
  clientId: z.string(),
});

const cancelTaskSchema = z.object({
  clientId: z.string(),
  taskId: z.string(),
  taskType: z.enum(['post', 'dm']),
});

export const marketingRouter = router({
  // Fetch all scheduled posts for a client
  getScheduledPosts: protectedProcedure
    .input(clientIdSchema)
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      try {
        const posts = await prisma.scheduledPost.findMany({
          where: { clientId },
          orderBy: { scheduledAt: 'asc' },
        });
        
        return posts;
      } catch (error) {
        logger.error({ error, clientId }, "Failed to fetch scheduled posts");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scheduled posts",
        });
      }
    }),
  
  // Fetch all auto DM tasks for a client
  getAutoDMTasks: protectedProcedure
    .input(clientIdSchema)
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      try {
        const tasks = await prisma.autoDMTask.findMany({
          where: { clientId },
          orderBy: { createdAt: 'desc' },
        });
        
        return tasks;
      } catch (error) {
        logger.error({ error, clientId }, "Failed to fetch auto DM tasks");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch auto DM tasks",
        });
      }
    }),
  
  // Create a new scheduled post
  createScheduledPost: protectedProcedure
    .input(scheduledPostSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platforms, content, mediaUrl, scheduledAt } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      // Verify that all selected platforms are connected
      try {
        const connectedPlatforms = await prisma.clientCredential.findMany({
          where: {
            clientId,
            platformType: {
              in: platforms
            }
          },
          select: {
            platformType: true
          }
        });
        
        const connectedTypes = connectedPlatforms.map(p => p.platformType);
        
        // Check if any platform is not connected
        const missingPlatforms = platforms.filter(p => !connectedTypes.includes(p));
        
        if (missingPlatforms.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Some platforms are not connected: ${missingPlatforms.join(', ')}`,
          });
        }
        
        // Create the scheduled post
        const scheduledPost = await prisma.scheduledPost.create({
          data: {
            clientId,
            platforms,
            content,
            mediaUrl,
            scheduledAt,
            status: 'scheduled',
          },
        });
        
        logger.info({ clientId, postId: scheduledPost.id }, "Scheduled post created");
        
        return scheduledPost;
      } catch (error) {
        logger.error({ error, clientId }, "Failed to create scheduled post");
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create scheduled post",
        });
      }
    }),
  
  // Create a new auto DM task
  createAutoDMTask: protectedProcedure
    .input(autoDMTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, platformType, trigger, message, isRecurring } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      // Verify that the selected platform is connected
      try {
        const connectedPlatform = await prisma.clientCredential.findUnique({
          where: {
            clientId_platformType: {
              clientId,
              platformType
            }
          }
        });
        
        if (!connectedPlatform) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Platform ${platformType} is not connected`,
          });
        }
        
        // Create the auto DM task
        const autoDMTask = await prisma.autoDMTask.create({
          data: {
            clientId,
            platformType,
            trigger,
            message,
            isRecurring,
            status: 'active',
          },
        });
        
        logger.info({ clientId, taskId: autoDMTask.id }, "Auto DM task created");
        
        return autoDMTask;
      } catch (error) {
        logger.error({ error, clientId }, "Failed to create auto DM task");
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create auto DM task",
        });
      }
    }),
  
  // Cancel a scheduled post or auto DM task
  cancelTask: protectedProcedure
    .input(cancelTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { clientId, taskId, taskType } = input;
      
      // Verify client ownership
      await verifyClientOwnership(userId, clientId);
      
      try {
        if (taskType === 'post') {
          // Cancel a scheduled post
          const post = await prisma.scheduledPost.findFirst({
            where: {
              id: taskId,
              clientId,
            },
          });
          
          if (!post) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Scheduled post not found",
            });
          }
          
          // Only allow cancellation of pending posts
          if (post.status !== 'scheduled') {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Cannot cancel post with status: ${post.status}`,
            });
          }
          
          // Update the post status to cancelled
          await prisma.scheduledPost.update({
            where: { id: taskId },
            data: { status: 'cancelled' },
          });
          
          logger.info({ clientId, postId: taskId }, "Scheduled post cancelled");
          
          return { success: true, message: "Post cancelled successfully" };
        } else {
          // Cancel an auto DM task
          const task = await prisma.autoDMTask.findFirst({
            where: {
              id: taskId,
              clientId,
            },
          });
          
          if (!task) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Auto DM task not found",
            });
          }
          
          // Update the task status to inactive
          await prisma.autoDMTask.update({
            where: { id: taskId },
            data: { status: 'inactive' },
          });
          
          logger.info({ clientId, taskId }, "Auto DM task cancelled");
          
          return { success: true, message: "Auto DM task cancelled successfully" };
        }
      } catch (error) {
        logger.error({ error, clientId, taskId, taskType }, "Failed to cancel task");
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel task",
        });
      }
    }),
}); 