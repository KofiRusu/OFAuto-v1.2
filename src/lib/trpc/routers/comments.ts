import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CommentVisibility, UserRole } from "@prisma/client";
import { canDeleteComment, canEditComment, canModerateComments, canViewComment, contentNeedsModeration } from "@/lib/permissions";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";

// Helper for logging audit events
const logAuditEvent = async (userId: string, action: string, entityId: string, details: any) => {
  await prisma.auditLog.create({
    data: {
      action: "SETTINGS_CHANGE", // Using settings_change as a general action
      entityType: "COMMENT",
      entityId,
      details: JSON.stringify(details),
      performedById: userId,
    },
  });
};

export const commentsRouter = createTRPCRouter({
  getComments: protectedProcedure
    .input(
      z.object({
        entityId: z.string(),
        entityType: z.string(),
        includeDeleted: z.boolean().optional(),
        page: z.number().min(1).optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { entityId, entityType, includeDeleted = false, page = 1, limit = 50 } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      const userRole = session.user.role;
      
      const skip = (page - 1) * limit;
      
      // Fetch comments with authors
      const comments = await db.comment.findMany({
        where: {
          entityId,
          entityType,
          isDeleted: includeDeleted ? undefined : false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          moderator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      });
      
      // Filter comments based on visibility permissions
      const filteredComments = comments.filter(comment => 
        canViewComment(comment, userId, userRole)
      );
      
      return filteredComments;
    }),
    
  getCommentById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      const userRole = session.user.role;
      
      const comment = await db.comment.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          moderator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
      
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }
      
      // Check if user is allowed to view this comment
      if (!canViewComment(comment, userId, userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this comment",
        });
      }
      
      return comment;
    }),
    
  addComment: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        entityId: z.string(),
        entityType: z.string(),
        visibility: z.nativeEnum(CommentVisibility).optional(),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { content, entityId, entityType, visibility = "PUBLIC", parentId } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      
      // Check if content needs moderation
      const needsModeration = contentNeedsModeration(content);
      
      const comment = await db.comment.create({
        data: {
          content,
          entityId,
          entityType,
          visibility,
          authorId: userId,
          parentId,
          needsModeration,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      });
      
      // If this is related to a campaign, update the relation
      if (entityType === "campaign") {
        await db.autoDMCampaign.update({
          where: { id: entityId },
          data: {
            comments: {
              connect: { id: comment.id },
            },
          },
        });
      }
      
      // If this is related to a task, update the relation
      if (entityType === "task") {
        await db.scheduledTask.update({
          where: { id: entityId },
          data: {
            comments: {
              connect: { id: comment.id },
            },
          },
        });
      }
      
      return comment;
    }),
    
  updateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).optional(),
        visibility: z.nativeEnum(CommentVisibility).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, content, visibility } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      const userRole = session.user.role;
      
      // Fetch the comment to check permissions
      const comment = await db.comment.findUnique({
        where: { id },
      });
      
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }
      
      // Check if user can edit this comment
      if (!canEditComment(comment, userId, userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to edit this comment",
        });
      }
      
      // Check if content needs moderation
      let needsModeration = comment.needsModeration;
      if (content && content !== comment.content) {
        needsModeration = contentNeedsModeration(content);
      }
      
      // Update the comment
      const updatedComment = await db.comment.update({
        where: { id },
        data: {
          content,
          visibility,
          updatedAt: new Date(),
          needsModeration: userRole === UserRole.ADMIN ? false : needsModeration,
          // Reset moderation status if content changed and user is not an admin
          ...(content && content !== comment.content && userRole !== UserRole.ADMIN
            ? {
                isModerated: false,
                isApproved: true, // Default to approved
                moderatorId: null,
                moderatedAt: null,
              }
            : {}),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
        },
      });
      
      return updatedComment;
    }),
    
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      const userRole = session.user.role;
      
      // Fetch the comment to check permissions
      const comment = await db.comment.findUnique({
        where: { id },
      });
      
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }
      
      // Check if user can delete this comment
      if (!canDeleteComment(comment, userId, userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this comment",
        });
      }
      
      // Soft delete the comment
      const deletedComment = await db.comment.update({
        where: { id },
        data: {
          isDeleted: true,
          content: userRole === UserRole.ADMIN ? comment.content : "[Deleted]",
        },
      });
      
      return deletedComment;
    }),
    
  moderateComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isApproved: z.boolean(),
        moderationNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, isApproved, moderationNotes } = input;
      const { session, db } = ctx;
      const userId = session.user.id;
      const userRole = session.user.role;
      
      // Check if user can moderate comments
      if (!canModerateComments(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to moderate comments",
        });
      }
      
      // Fetch the comment
      const comment = await db.comment.findUnique({
        where: { id },
      });
      
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }
      
      // Update the comment with moderation status
      const moderatedComment = await db.comment.update({
        where: { id },
        data: {
          isModerated: true,
          isApproved,
          moderatorId: userId,
          moderatedAt: new Date(),
          moderationNotes,
          needsModeration: false,
          // If rejected, also mark as deleted
          ...(isApproved ? {} : { isDeleted: true }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
            },
          },
          moderator: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });
      
      return moderatedComment;
    }),
    
  markForModeration: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { session, db } = ctx;
      const userRole = session.user.role;
      
      // Check if user can moderate comments
      if (!canModerateComments(userRole)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to flag comments for moderation",
        });
      }
      
      // Update the comment to need moderation
      const flaggedComment = await db.comment.update({
        where: { id },
        data: {
          needsModeration: true,
          isModerated: false,
        },
      });
      
      return flaggedComment;
    }),
});

export default commentsRouter; 