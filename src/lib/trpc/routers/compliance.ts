import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, managerProcedure, adminProcedure } from "../server";
import {
  ComplianceReportCreateSchema,
  ReportListQuerySchema,
  ReportUpdateSchema,
  TakedownRequestCreateSchema,
  TakedownListQuerySchema,
  TakedownRequestUpdateSchema
} from "@/lib/schemas/compliance";
import { z } from "zod";

export const complianceRouter = router({
  /**
   * Submit a compliance report (by any authenticated user)
   */
  submitReport: protectedProcedure
    .input(ComplianceReportCreateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Create the report in the database
        const report = await ctx.prisma.complianceReport.create({
          data: {
            reporterId: input.reporterId,
            type: input.type,
            contentId: input.contentId,
            details: input.details,
            // Status defaults to PENDING
          }
        });

        return {
          success: true,
          report
        };
      } catch (error) {
        ctx.logger.error('Error submitting compliance report', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit report',
          cause: error,
        });
      }
    }),

  /**
   * Get compliance reports (managers and admins only)
   */
  getReports: managerProcedure
    .input(ReportListQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        const { status, type, limit, cursor } = input;

        // Build filters
        const where = {
          ...(status && { status }),
          ...(type && { type }),
        };

        // Get reports with pagination
        const reports = await ctx.prisma.complianceReport.findMany({
          where,
          take: limit,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            takedowns: true,
          }
        });

        // Get the next cursor
        const nextCursor = reports.length === limit ? reports[reports.length - 1].id : undefined;

        return {
          reports,
          nextCursor,
        };
      } catch (error) {
        ctx.logger.error('Error fetching compliance reports', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reports',
          cause: error,
        });
      }
    }),

  /**
   * Get a single report by ID
   */
  getReportById: managerProcedure
    .input(z.object({ id: z.string().uuid("Invalid report ID") }))
    .query(async ({ ctx, input }) => {
      try {
        const report = await ctx.prisma.complianceReport.findUnique({
          where: { id: input.id },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            takedowns: {
              orderBy: {
                createdAt: 'desc',
              }
            },
          }
        });

        if (!report) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        return { report };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error fetching compliance report', { error, id: input.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch report',
          cause: error,
        });
      }
    }),

  /**
   * Review and update a report (admin only)
   */
  reviewReport: adminProcedure
    .input(ReportUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the report exists
        const existingReport = await ctx.prisma.complianceReport.findUnique({
          where: { id: input.id }
        });

        if (!existingReport) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        // Update the report status
        const updatedReport = await ctx.prisma.complianceReport.update({
          where: { id: input.id },
          data: {
            status: input.status,
            // In a real implementation, we might store admin notes in a separate field or model
          }
        });

        return {
          success: true,
          report: updatedReport
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error reviewing compliance report', { error, reportId: input.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to review report',
          cause: error,
        });
      }
    }),

  /**
   * Create a takedown request (admin only)
   */
  createTakedownRequest: adminProcedure
    .input(TakedownRequestCreateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the report exists
        const existingReport = await ctx.prisma.complianceReport.findUnique({
          where: { id: input.reportId }
        });

        if (!existingReport) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        // Create the takedown request
        const takedownRequest = await ctx.prisma.takedownRequest.create({
          data: {
            reportId: input.reportId,
            requestedBy: input.requestedBy,
            // Store reason in a separate field in a real implementation
          }
        });

        // Also update the report status
        await ctx.prisma.complianceReport.update({
          where: { id: input.reportId },
          data: {
            status: 'REVIEWED',
          }
        });

        return {
          success: true,
          takedownRequest
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error creating takedown request', { error, reportId: input.reportId });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create takedown request',
          cause: error,
        });
      }
    }),

  /**
   * Get takedown requests (admin only)
   */
  getTakedownRequests: adminProcedure
    .input(TakedownListQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        const { status, limit, cursor } = input;

        // Build filters
        const where = {
          ...(status && { status }),
        };

        // Get takedown requests with pagination
        const takedownRequests = await ctx.prisma.takedownRequest.findMany({
          where,
          take: limit,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            report: {
              include: {
                reporter: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
                }
              }
            }
          }
        });

        // Get the next cursor
        const nextCursor = takedownRequests.length === limit 
          ? takedownRequests[takedownRequests.length - 1].id 
          : undefined;

        return {
          takedownRequests,
          nextCursor,
        };
      } catch (error) {
        ctx.logger.error('Error fetching takedown requests', { error });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch takedown requests',
          cause: error,
        });
      }
    }),

  /**
   * Update takedown request status (admin only)
   */
  updateTakedownRequest: adminProcedure
    .input(TakedownRequestUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the takedown request exists
        const existingRequest = await ctx.prisma.takedownRequest.findUnique({
          where: { id: input.id },
          include: { report: true }
        });

        if (!existingRequest) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Takedown request not found',
          });
        }

        // Update the takedown request
        const updatedRequest = await ctx.prisma.takedownRequest.update({
          where: { id: input.id },
          data: {
            status: input.status,
            // Store notes in a separate field in a real implementation
          }
        });

        // If the takedown is completed, also mark the report as RESOLVED
        if (input.status === 'COMPLETED') {
          await ctx.prisma.complianceReport.update({
            where: { id: existingRequest.reportId },
            data: {
              status: 'RESOLVED',
            }
          });
        }

        return {
          success: true,
          takedownRequest: updatedRequest
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        ctx.logger.error('Error updating takedown request', { error, requestId: input.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update takedown request',
          cause: error,
        });
      }
    }),
}); 