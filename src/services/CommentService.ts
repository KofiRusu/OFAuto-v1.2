import { Comment, CommentVisibility, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canViewComment } from "@/lib/permissions";

export interface CreateCommentInput {
  content: string;
  authorId: string;
  entityId: string;  // The ID of the entity this comment is attached to (post, campaign, etc.)
  entityType: string; // The type of entity (post, campaign, etc.)
  visibility: CommentVisibility;
  parentId?: string;  // For threaded comments
}

export interface UpdateCommentInput {
  id: string;
  content?: string;
  visibility?: CommentVisibility;
}

export interface ModerateCommentInput {
  id: string;
  isApproved: boolean;
  moderatorId: string;
  moderationNotes?: string;
}

export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment(input: CreateCommentInput): Promise<Comment> {
    return db.comment.create({
      data: {
        content: input.content,
        authorId: input.authorId,
        entityId: input.entityId,
        entityType: input.entityType,
        visibility: input.visibility,
        parentId: input.parentId,
      },
    });
  }

  /**
   * Update an existing comment
   */
  static async updateComment(input: UpdateCommentInput): Promise<Comment> {
    const { id, ...data } = input;
    
    return db.comment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a comment (soft delete)
   */
  static async deleteComment(id: string): Promise<Comment> {
    return db.comment.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  /**
   * Permanently delete a comment from the database
   */
  static async permanentlyDeleteComment(id: string): Promise<Comment> {
    return db.comment.delete({
      where: { id },
    });
  }

  /**
   * Moderate a comment
   */
  static async moderateComment(input: ModerateCommentInput): Promise<Comment> {
    const { id, isApproved, moderatorId, moderationNotes } = input;
    
    return db.comment.update({
      where: { id },
      data: {
        isModerated: true,
        isApproved,
        moderatedAt: new Date(),
        moderatorId,
        moderationNotes,
        needsModeration: false,
      },
    });
  }

  /**
   * Mark a comment for moderation
   */
  static async markForModeration(id: string): Promise<Comment> {
    return db.comment.update({
      where: { id },
      data: {
        needsModeration: true,
      },
    });
  }

  /**
   * Get comments for an entity with filtering based on user permissions
   */
  static async getComments(options: {
    entityId: string;
    entityType: string;
    userId: string;
    userRole: string;
    includeDeleted?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { 
      entityId, 
      entityType, 
      userId, 
      userRole,
      includeDeleted = false,
      page = 1,
      limit = 50
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Get all comments for the entity
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
    
    // Get total count
    const totalCount = await db.comment.count({
      where: {
        entityId,
        entityType,
        isDeleted: includeDeleted ? undefined : false,
      },
    });
    
    return {
      comments: filteredComments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get a single comment by ID
   */
  static async getCommentById(id: string) {
    return db.comment.findUnique({
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
      },
    });
  }
} 