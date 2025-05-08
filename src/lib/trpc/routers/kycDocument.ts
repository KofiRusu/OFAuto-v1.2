import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, managerProcedure } from "../server";
import { 
  KycDocumentCreateSchema, 
  KycDocumentUpdateSchema,
  KycTypeEnum,
  KycStatusEnum
} from "@/lib/schemas/kycDocument";

/**
 * Router for KYC Document operations
 */
export const kycDocumentRouter = router({
  /**
   * Submit a new KYC document (Available to all authenticated users)
   */
  submitKycDoc: protectedProcedure
    .input(KycDocumentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { type, fileUrl } = input;

      // Users can only submit documents for themselves
      if (input.userId !== userId && user?.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only submit documents for your own account",
        });
      }

      // Create the document
      const document = await ctx.prisma.kycDocument.create({
        data: {
          userId: input.userId,
          type: type,
          fileUrl: fileUrl,
          status: "PENDING",
        },
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

      return document;
    }),

  /**
   * Get KYC documents for a user
   * Users can only see their own documents
   * Managers/Admins can see any user's documents
   */
  getUserKycDocs: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        type: KycTypeEnum.optional(),
        status: KycStatusEnum.optional(),
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { type, status, limit, offset } = input;

      // Determine which user's documents to retrieve
      let targetUserId = userId;
      
      // Allow managers/admins to view other users' documents
      if (input.userId && (user?.role === "MANAGER" || user?.role === "ADMIN")) {
        targetUserId = input.userId;
      } else if (input.userId && input.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own documents",
        });
      }

      // Build the filter
      const where: any = { userId: targetUserId };
      
      // Add optional filters
      if (type) {
        where.type = type;
      }
      
      if (status) {
        where.status = status;
      }

      // Get documents with pagination
      const [documents, total] = await Promise.all([
        ctx.prisma.kycDocument.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.kycDocument.count({ where }),
      ]);

      return {
        documents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get all pending KYC documents (Admin/Manager only)
   */
  getPendingKycDocs: managerProcedure
    .input(
      z.object({
        status: KycStatusEnum.optional().default("PENDING"),
        limit: z.number().min(1).max(100).optional().default(10),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { status, limit, offset } = input;
      
      // Get documents with pagination
      const [documents, total] = await Promise.all([
        ctx.prisma.kycDocument.findMany({
          where: {
            status,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            submittedAt: "asc", // Oldest first for review queue
          },
          take: limit,
          skip: offset,
        }),
        ctx.prisma.kycDocument.count({ 
          where: { status } 
        }),
      ]);

      return {
        documents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  /**
   * Get a single KYC document by ID
   */
  getKycDoc: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { id } = input;

      const document = await ctx.prisma.kycDocument.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Check permissions:
      // 1. Document belongs to the user
      // 2. User is a manager or admin
      if (document.userId !== userId && user?.role !== "MANAGER" && user?.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this document",
        });
      }

      return document;
    }),

  /**
   * Review a KYC document (Manager/Admin only)
   */
  reviewKycDoc: managerProcedure
    .input(KycDocumentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { id, status, notes } = input;

      // Find the document
      const document = await ctx.prisma.kycDocument.findUnique({
        where: { id },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      // Make sure the document is pending and can be reviewed
      if (document.status !== "PENDING" && document.status !== "NEEDS_INFO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This document has already been reviewed",
        });
      }

      // Update the document with review details
      const updatedDocument = await ctx.prisma.kycDocument.update({
        where: { id },
        data: {
          status,
          reviewerId: userId,
          reviewedAt: new Date(),
          // If we had a notes field in the schema, we would update it here
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return updatedDocument;
    }),
}); 