import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc/trpc';
import { UserRole } from '@prisma/client';
import {
  KpiCreateSchema,
  KpiUpdateSchema,
  KpiListSchema,
  KpiDeleteSchema,
} from '@/lib/schemas/kpi';

// Create a manager-only procedure
const managerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if the user is a MANAGER or ADMIN
  const userRole = ctx.auth?.userRole;
  
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

export const kpiRouter = createTRPCRouter({
  /**
   * Create a new KPI
   * Manager/Admin only
   */
  createKpi: managerProcedure
    .input(KpiCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      
      try {
        logger.info('Creating KPI', { userId: input.userId });
        
        // Create new KPI
        const kpi = await prisma.kPI.create({
          data: {
            userId: input.userId,
            name: input.name,
            targetValue: input.targetValue,
            dueDate: input.dueDate,
          },
        });
        
        return kpi;
      } catch (error) {
        logger.error('Error creating KPI', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create KPI',
          cause: error,
        });
      }
    }),
  
  /**
   * List KPIs with optional filters
   * Manager/Admin can see all KPIs or filter by userId
   * Regular users can only see their own KPIs
   */
  listKpis: protectedProcedure
    .input(KpiListSchema.optional())
    .query(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      const isManager = auth.userRole === UserRole.MANAGER || auth.userRole === UserRole.ADMIN;
      
      try {
        // Build query filters
        const filters: any = {};
        
        // If not manager/admin, can only see own KPIs
        if (!isManager) {
          filters.userId = auth.userId;
        } 
        // If manager and userId provided, filter by that userId
        else if (input?.userId) {
          filters.userId = input.userId;
        }
        
        // Add status filter if provided
        if (input?.status) {
          filters.status = input.status;
        }
        
        // Get KPIs based on filters
        const kpis = await prisma.kPI.findMany({
          where: filters,
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' },
          ],
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
        
        return kpis;
      } catch (error) {
        logger.error('Error listing KPIs', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list KPIs',
          cause: error,
        });
      }
    }),
  
  /**
   * Update a KPI
   * Manager/Admin can update any KPI
   * Regular users can only update their own KPIs
   */
  updateKpi: protectedProcedure
    .input(KpiUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      const isManager = auth.userRole === UserRole.MANAGER || auth.userRole === UserRole.ADMIN;
      
      try {
        // Get the KPI to update
        const kpi = await prisma.kPI.findUnique({
          where: { id: input.id },
        });
        
        if (!kpi) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'KPI not found',
          });
        }
        
        // Check permissions: only managers/admins or the KPI owner can update
        if (!isManager && kpi.userId !== auth.userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this KPI',
          });
        }
        
        // If updating current value, check if it meets or exceeds target
        let newStatus = input.status;
        if (input.currentValue !== undefined && !input.status) {
          const valueToCheck = input.currentValue;
          
          if (valueToCheck >= kpi.targetValue) {
            newStatus = 'COMPLETED';
          }
        }
        
        // Update KPI
        const updatedKpi = await prisma.kPI.update({
          where: { id: input.id },
          data: {
            ...input.name && { name: input.name },
            ...input.targetValue && { targetValue: input.targetValue },
            ...input.currentValue !== undefined && { currentValue: input.currentValue },
            ...newStatus && { status: newStatus },
            ...input.dueDate !== undefined && { dueDate: input.dueDate },
          },
        });
        
        return updatedKpi;
      } catch (error) {
        logger.error('Error updating KPI', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update KPI',
          cause: error,
        });
      }
    }),
  
  /**
   * Delete a KPI
   * Manager/Admin only
   */
  deleteKpi: managerProcedure
    .input(KpiDeleteSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, auth, logger } = ctx;
      
      try {
        // Check if KPI exists
        const kpi = await prisma.kPI.findUnique({
          where: { id: input.id },
        });
        
        if (!kpi) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'KPI not found',
          });
        }
        
        // Delete KPI
        await prisma.kPI.delete({
          where: { id: input.id },
        });
        
        return true;
      } catch (error) {
        logger.error('Error deleting KPI', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete KPI',
          cause: error,
        });
      }
    }),
}); 