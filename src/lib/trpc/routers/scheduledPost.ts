import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../server";
import { PostStatus, UserRole } from "@prisma/client";
import { csrf } from "@/lib/security/csrf";
import { v4 as uuidv4 } from "uuid";

// Input schema for getting all posts with optional filters and pagination
const getPostsInputSchema = z.object({
  clientId: z.string().optional(),
  platformType: z.string().optional(),
  status: z.nativeEnum(PostStatus).optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  // Pagination parameters
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  // Sorting parameters
  sortBy: z.enum(['scheduledFor', 'createdAt', 'updatedAt', 'status']).default('scheduledFor'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Input schema for creating a post
const createPostInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scheduledFor: z.date(),
  clientId: z.string(),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  mediaUrls: z.array(z.string()).optional().default([]),
  status: z.nativeEnum(PostStatus).default(PostStatus.DRAFT),
  createdById: z.string(),
});

// Input schema for updating a post
const updatePostInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  scheduledFor: z.date(),
  status: z.nativeEnum(PostStatus),
});

// Input schema for deleting a post
const deletePostInputSchema = z.object({
  id: z.string(),
});

// Add a helper function to check platform access
/**
 * Helper function to get platforms a user has access to
 */
async function getUserApprovedPlatforms(prisma: any, userId: string) {
  try {
    const platformAccessRecords = await prisma.platformAccess.findMany({
      where: {
        userId: userId,
        approved: true,
      },
      include: {
        platform: {
          select: {
            id: true,
            name: true,
            type: true,
            clientId: true,
          },
        },
      },
    });
    
    // Extract just the platform objects
    return platformAccessRecords.map(record => record.platform);
  } catch (error) {
    console.error('Error fetching approved platforms:', error);
    return [];
  }
}

export const scheduledPostRouter = router({
  /**
   * Get all scheduled posts with filters and pagination
   */
  getAll: protectedProcedure
    .input(getPostsInputSchema)
    .query(async ({ ctx, input }) => {
      const { 
        userId, 
        user,
        logger
      } = ctx;
      
      const { 
        clientId, 
        platformType, 
        status, 
        fromDate, 
        toDate, 
        page, 
        pageSize, 
        sortBy, 
        sortOrder 
      } = input;

      // Calculate pagination values
      const skip = (page - 1) * pageSize;
      const take = pageSize;
      
      // Build where clause
      let where: any = {};
      
      // Apply filters
      if (clientId) {
        where.clientId = clientId;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (fromDate) {
        where.scheduledFor = {
          ...(where.scheduledFor || {}),
          gte: fromDate,
        };
      }
      
      if (toDate) {
        where.scheduledFor = {
          ...(where.scheduledFor || {}),
          lte: toDate,
        };
      }
      
      // Check user access based on role
      if (user.role !== UserRole.ADMIN) {
        // For non-admin users, filter by user-accessible clients
        const accessibleClients = await ctx.prisma.client.findMany({
          where: { userId },
          select: { id: true },
        });
        
        const clientIds = accessibleClients.map((client) => client.id);
        
        if (clientId && !clientIds.includes(clientId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to this client",
          });
        }
        
        // Filter by accessible clients
        where.clientId = clientId || { in: clientIds };
      }
      
      // Platform type filter requires a join
      let platformsQuery = {};
      if (platformType) {
        // If user is a MODEL, ensure they only see approved platforms
        if (user.role === UserRole.MODEL) {
          const approvedPlatforms = await getUserApprovedPlatforms(ctx.prisma, userId);
          const approvedPlatformIds = approvedPlatforms.map(p => p.id);
          
          platformsQuery = {
            some: {
              platform: {
                type: platformType,
                id: { in: approvedPlatformIds }
              },
            },
          };
        } else {
          platformsQuery = {
            some: {
              platform: {
                type: platformType,
              },
            },
          };
        }
      } else if (user.role === UserRole.MODEL) {
        // If no platform type filter but user is a MODEL, still filter by approved platforms
        const approvedPlatforms = await getUserApprovedPlatforms(ctx.prisma, userId);
        const approvedPlatformIds = approvedPlatforms.map(p => p.id);
        
        platformsQuery = {
          some: {
            platform: {
              id: { in: approvedPlatformIds }
            },
          },
        };
      }
      
      // Log query parameters for monitoring
      logger.info('Fetching scheduled posts with pagination', { 
        userId, 
        role: user.role,
        page,
        pageSize,
        filters: { clientId, platformType, status, fromDate, toDate }
      });
      
      // Execute query with COUNT in parallel for better performance
      const [scheduledPosts, totalCount] = await Promise.all([
        // Query for paginated results
        ctx.prisma.scheduledPost.findMany({
          where: {
            ...where,
            platforms: platformsQuery,
          },
          include: {
            client: {
              select: {
                name: true,
              },
            },
            platforms: {
              include: {
                platform: {
                  select: {
                    id: true,
                    type: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take,
        }),
        
        // Count total matching records for pagination
        ctx.prisma.scheduledPost.count({
          where: {
            ...where,
            platforms: platformsQuery,
          },
        }),
      ]);
      
      // Return results with pagination metadata
      return {
        posts: scheduledPosts,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          totalItems: totalCount,
          hasMore: skip + take < totalCount,
        },
      };
    }),
  
  /**
   * Get a single scheduled post by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId, user, logger } = ctx;
      const isAdmin = user.role === UserRole.ADMIN;
      const isManager = user.role === UserRole.MANAGER;
      
      logger.info('Fetching scheduled post by ID', { userId, postId: input.id, role: user.role });
      
      const post = await ctx.prisma.scheduledPost.findUnique({
        where: { id: input.id },
        include: {
          client: {
            select: {
              name: true,
              userId: true,
            },
          },
          platforms: {
            include: {
              platform: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled post not found",
        });
      }
      
      // Check if user has access to this post
      const hasAccess = 
        isAdmin || 
        post.createdById === userId || 
        (isManager && post.client?.userId === userId);
      
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to access this post",
        });
      }
      
      return post;
    }),
  
  /**
   * Get available platforms for posts
   * This ensures models only see platforms they're approved for
   */
  getAvailablePlatforms: protectedProcedure
    .input(z.object({
      clientId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      
      // Base query for platforms
      let whereClause: any = {};
      
      if (input.clientId) {
        whereClause.clientId = input.clientId;
      }
      
      // For models, filter to only show approved platforms
      if (user.role === UserRole.MODEL) {
        const approvedPlatforms = await getUserApprovedPlatforms(ctx.prisma, userId);
        
        // If filtering by client, combine with client filter
        if (input.clientId) {
          const approvedPlatformIds = approvedPlatforms.map(p => p.id);
          whereClause.id = { in: approvedPlatformIds };
        } else {
          // If no client filter, just return the approved platforms
          return {
            platforms: approvedPlatforms
          };
        }
      }
      
      // Regular query for non-model users or when combining with client filter
      const platforms = await ctx.prisma.platform.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          type: true,
          clientId: true,
        },
      });
      
      return {
        platforms,
      };
    }),
  
  /**
   * Create a new scheduled post
   */
  create: protectedProcedure
    .use(csrf()) // Add CSRF protection
    .input(createPostInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user, logger } = ctx;
      const { 
        title, 
        content, 
        scheduledFor, 
        platforms, 
        mediaUrls = [], 
        status = "DRAFT", 
        clientId, 
        createdById 
      } = input;
      
      logger.info('Creating scheduled post', { 
        userId,
        clientId,
        status,
        platformCount: platforms.length
      });
      
      // Check if the client exists and user has access to it
      const client = await ctx.prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true },
      });
      
      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client not found",
        });
      }
      
      // If not admin, check if user has access to the client
      if (user.role !== UserRole.ADMIN && client.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to create posts for this client",
        });
      }
      
      // Check if the platforms exist and belong to the client
      const validPlatforms = await ctx.prisma.platform.findMany({
        where: {
          id: { in: platforms },
          clientId,
        },
      });
      
      if (validPlatforms.length !== platforms.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more platforms are invalid or don't belong to this client",
        });
      }
      
      // For MODEL users, verify they have access to all selected platforms
      if (user.role === UserRole.MODEL) {
        const approvedPlatforms = await getUserApprovedPlatforms(ctx.prisma, userId);
        const approvedPlatformIds = approvedPlatforms.map(p => p.id);
        
        // Check if all selected platforms are in the approved list
        const unauthorizedPlatforms = platforms.filter(id => !approvedPlatformIds.includes(id));
        
        if (unauthorizedPlatforms.length > 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have access to one or more selected platforms",
          });
        }
      }
      
      // Create the scheduled post with transaction to ensure all relations are created
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create the post
        const newPost = await tx.scheduledPost.create({
          data: {
            title,
            content,
            scheduledFor,
            clientId,
            createdById: userId,
            status,
            mediaUrls,
            // Create platform connections
            platforms: {
              create: platforms.map((platformId) => ({
                platform: {
                  connect: { id: platformId },
                },
              })),
            },
          },
          include: {
            client: {
              select: {
                name: true,
              },
            },
            platforms: {
              include: {
                platform: {
                  select: {
                    id: true,
                    type: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
        
        return newPost;
      });
      
      return result;
    }),
  
  /**
   * Update a scheduled post
   */
  update: protectedProcedure
    .use(csrf()) // Add CSRF protection
    .input(updatePostInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user, logger } = ctx;
      const { id, title, content, scheduledFor, status } = input;
      
      logger.info('Updating scheduled post', { userId, postId: id, role: user.role });
      
      // Check if the post exists
      const existingPost = await ctx.prisma.scheduledPost.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              userId: true,
            },
          },
        },
      });
      
      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled post not found",
        });
      }
      
      // Check if user has permission to update the post
      const isAdmin = user.role === UserRole.ADMIN;
      const isCreator = existingPost.createdById === userId;
      const isClientManager = 
        user.role === UserRole.MANAGER && 
        existingPost.client?.userId === userId;
      
      if (!isAdmin && !isCreator && !isClientManager) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this post",
        });
      }
      
      // Don't allow updating posts that have already been posted
      if (existingPost.status === PostStatus.POSTED && status !== PostStatus.POSTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot modify a post that has already been published",
        });
      }
      
      // Update the post
      const updatedPost = await ctx.prisma.scheduledPost.update({
        where: { id },
        data: {
          title,
          content,
          scheduledFor,
          status,
          updatedAt: new Date(),
        },
        include: {
          client: {
            select: {
              name: true,
            },
          },
          platforms: {
            include: {
              platform: {
                select: {
                  id: true,
                  type: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      
      return updatedPost;
    }),
  
  /**
   * Delete a scheduled post
   */
  delete: protectedProcedure
    .use(csrf()) // Add CSRF protection
    .input(deletePostInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user, logger } = ctx;
      const { id } = input;
      
      logger.info('Deleting scheduled post', { userId, postId: id, role: user.role });
      
      // Check if the post exists
      const existingPost = await ctx.prisma.scheduledPost.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              userId: true,
            },
          },
        },
      });
      
      if (!existingPost) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled post not found",
        });
      }
      
      // Check if user has permission to delete the post
      const isAdmin = user.role === UserRole.ADMIN;
      const isCreator = existingPost.createdById === userId;
      const isClientManager = 
        user.role === UserRole.MANAGER && 
        existingPost.client?.userId === userId;
      
      if (!isAdmin && !isCreator && !isClientManager) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this post",
        });
      }
      
      // Don't allow deleting posts that have already been posted
      if (existingPost.status === PostStatus.POSTED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete a post that has already been published",
        });
      }
      
      // Delete the post
      await ctx.prisma.scheduledPost.delete({
        where: { id },
      });
      
      return { success: true };
    }),
}); 