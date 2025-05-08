import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, managerProcedure } from "../server";
import { 
  automationSchema, 
  createAutomationSchema,
  updateAutomationSchema 
} from "@/lib/schemas/automation";
import { csrf } from "@/lib/security/csrf";

export const automationRouter = router({
  /**
   * Get all automations based on client and user role
   */
  getAll: protectedProcedure
    .input(
      automationSchema.pick({ 
        clientId: true 
      }).partial()
    )
    .query(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;

      // Base query
      const where = clientId ? { clientId } : {};
      
      // If admin, return all automations or filtered by clientId
      // If manager or user, only return their assigned automations
      if (user.role !== 'ADMIN') {
        // For non-admins, get their clients
        const clients = await ctx.prisma.client.findMany({
          where: { userId: userId as string },
          select: { id: true },
        });
        
        const clientIds = clients.map(client => client.id);
        
        if (clientId && !clientIds.includes(clientId)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this client',
          });
        }
        
        // Add client filter for non-admins
        where.clientId = clientId || { in: clientIds };
      }

      // Log the query operation
      ctx.logger.info('Fetching automations', { userId, clientId, role: user.role });

      return await ctx.prisma.automation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      });
    }),
  
  /**
   * Get an automation by ID
   */
  getById: protectedProcedure
    .input(automationSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      const automation = await ctx.prisma.automation.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, name: true, userId: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      });
      
      if (!automation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }
      
      // Check if the user has access to this automation
      if (user.role !== 'ADMIN' && automation.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this automation',
        });
      }
      
      return automation;
    }),
  
  /**
   * Create a new automation
   */
  create: managerProcedure
    .use(csrf()) // Add CSRF protection
    .input(createAutomationSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, user } = ctx;
      const { clientId } = input;
      
      // Check client access
      if (user.role !== 'ADMIN') {
        const client = await ctx.prisma.client.findUnique({
          where: { id: clientId },
        });
        
        if (!client || client.userId !== userId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to create automations for this client',
          });
        }
      }
      
      // Log the creation attempt
      ctx.logger.info('Creating automation', { userId, clientId, role: user.role });
      
      // Create the automation
      const automation = await ctx.prisma.automation.create({
        data: {
          ...input,
          createdById: userId as string,
        },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      });
      
      return automation;
    }),
  
  /**
   * Update an automation
   */
  update: managerProcedure
    .use(csrf()) // Add CSRF protection
    .input(updateAutomationSchema.extend({ id: automationSchema.shape.id }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const { userId, user } = ctx;
      
      // First check if the automation exists and if the user can modify it
      const existingAutomation = await ctx.prisma.automation.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          }
        }
      });
      
      if (!existingAutomation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingAutomation.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this automation',
        });
      }
      
      // Log the update attempt
      ctx.logger.info('Updating automation', { userId, id, role: user.role });
      
      // Update automation
      const updatedAutomation = await ctx.prisma.automation.update({
        where: { id },
        data,
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      });
      
      return updatedAutomation;
    }),
  
  /**
   * Delete an automation
   */
  delete: managerProcedure
    .use(csrf()) // Add CSRF protection
    .input(automationSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      // First check if the automation exists and if the user can delete it
      const existingAutomation = await ctx.prisma.automation.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          }
        }
      });
      
      if (!existingAutomation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingAutomation.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this automation',
        });
      }
      
      // Log the deletion attempt
      ctx.logger.info('Deleting automation', { userId, id, role: user.role });
      
      // Delete automation
      await ctx.prisma.automation.delete({
        where: { id },
      });
      
      return { success: true };
    }),
    
  /**
   * Toggle automation active status
   */
  toggleActive: managerProcedure
    .use(csrf()) // Add CSRF protection
    .input(automationSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { userId, user } = ctx;
      
      // First check if the automation exists and if the user can modify it
      const existingAutomation = await ctx.prisma.automation.findUnique({
        where: { id },
        include: {
          client: {
            select: { id: true, userId: true }
          }
        }
      });
      
      if (!existingAutomation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Automation not found',
        });
      }
      
      // Check permissions
      if (user.role !== 'ADMIN' && existingAutomation.client.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this automation',
        });
      }
      
      // Log the toggle attempt
      ctx.logger.info('Toggling automation status', { 
        userId, 
        id, 
        role: user.role,
        previousStatus: existingAutomation.isActive,
        newStatus: !existingAutomation.isActive
      });
      
      // Toggle the active status
      const updatedAutomation = await ctx.prisma.automation.update({
        where: { id },
        data: {
          isActive: !existingAutomation.isActive,
        },
        include: {
          client: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, name: true }
          }
        }
      });
      
      return updatedAutomation;
    }),
}); 